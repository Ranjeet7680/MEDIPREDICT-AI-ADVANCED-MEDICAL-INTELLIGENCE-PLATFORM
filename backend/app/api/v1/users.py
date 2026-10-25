from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserUpdate
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(current_user)

    AuditService.log_event(
        db,
        action="USER_UPDATE_PROFILE",
        user_id=current_user.id,
        resource_type="User",
        resource_id=str(current_user.id),
    )
    return current_user

@router.delete("/me")
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    db.delete(current_user)
    db.commit()

    AuditService.log_event(
        db,
        action="USER_DELETE_ACCOUNT",
        user_id=user_id,
        resource_type="User",
        resource_id=str(user_id),
    )
    return {"message": "User account and all associated personal records successfully deleted."}
