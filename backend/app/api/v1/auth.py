import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.models import AuditEvent, User, UserConsent, UserSession
from app.schemas.schemas import (
    PasswordResetConfirm,
    PasswordResetRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "patient",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize standard consents
    for c_type in ["ai_data_analysis", "health_records_storage", "anonymized_research"]:
        consent = UserConsent(
            user_id=user.id,
            consent_type=c_type,
            granted=True,
            version="1.0",
            ip_address=request.client.host if request.client else "127.0.0.1",
        )
        db.add(consent)
    db.commit()

    AuditService.log_event(
        db,
        action="USER_REGISTER",
        user_id=user.id,
        resource_type="User",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    )

    return user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedException("User account is disabled.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Record active session
    session_rec = UserSession(
        user_id=user.id,
        token_hash=get_password_hash(refresh_token[:20]),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
    )
    db.add(session_rec)
    db.commit()

    AuditService.log_event(
        db,
        action="USER_LOGIN",
        user_id=user.id,
        resource_type="UserSession",
        resource_id=str(session_rec.id),
        ip_address=request.client.host if request.client else None,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }

@router.post("/refresh", response_model=Dict[str, str] if False else Any)
def refresh_token_endpoint(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User inactive or not found")

    new_access_token = create_access_token(user.id)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Deactivate active user sessions
    db.query(UserSession).filter(UserSession.user_id == current_user.id).update({"is_active": False})
    db.commit()

    AuditService.log_event(
        db,
        action="USER_LOGOUT",
        user_id=current_user.id,
        resource_type="User",
        resource_id=str(current_user.id),
    )
    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # In production, send email with reset token. Here, return secure message.
    reset_token = create_access_token(f"reset_{user.id}" if user else "fake_reset", datetime.timedelta(minutes=15))
    return {
        "message": "If this email is registered, password reset instructions have been dispatched.",
        "reset_token_dev": reset_token,
    }

@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    payload = decode_token(req.token)
    if not payload or not str(payload.get("sub", "")).startswith("reset_"):
        raise ValidationException("Invalid or expired password reset token.")

    user_id = int(str(payload.get("sub")).replace("reset_", ""))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValidationException("User not found.")

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()

    AuditService.log_event(
        db,
        action="PASSWORD_RESET_SUCCESS",
        user_id=user.id,
        resource_type="User",
        resource_id=str(user.id),
    )
    return {"message": "Password updated successfully. You may now log in."}
