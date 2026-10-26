import datetime
from typing import Callable, Generator, List, Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token, get_password_hash
from app.db.session import get_db
from app.models.models import ClinicianPatientRelationship, User

def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired access token")

    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedException("Invalid token payload: missing subject")

    user = None
    # 1. Try resolving as integer ID
    try:
        user_id_int = int(sub)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        # 2. Sub is a Supabase Auth UUID or string identifier
        email = payload.get("email")
        if email:
            user = db.query(User).filter(User.email == email.lower()).first()
            if not user:
                # Provision secure local mirror user with least-privilege 'patient' role
                user = User(
                    email=email.lower(),
                    hashed_password=get_password_hash("SupabaseAuthFederatedUserSecret!"),
                    full_name=payload.get("user_metadata", {}).get("full_name") or email.split("@")[0].capitalize(),
                    role="patient",
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if not user or not user.is_active:
        raise UnauthorizedException("User account not found or deactivated")

    return user

def get_optional_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        return get_current_user(db=db, authorization=authorization)
    except Exception:
        return None

def require_roles(allowed_roles: List[str]) -> Callable:
    """Dependency factory enforcing strict Server-Side Role-Based Access Control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied. Required role: {', '.join(allowed_roles)}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker

def verify_patient_access(patient_id: int, current_user: User, db: Session) -> bool:
    """
    Enforces Relationship-Based Access Control (ReBAC) & Resource Ownership:
    1. Patient accessing their own records: ALWAYS ALLOWED.
    2. Administrator: ALLOWED for governance/audit.
    3. Clinician: ALLOWED ONLY IF an active care relationship exists with the patient.
    4. Any other actor or unauthorized clinician: FORBIDDEN (403).
    """
    # 1. Self-access
    if current_user.id == patient_id:
        return True

    # 2. Admin access
    if current_user.role == "admin":
        return True

    # 3. Clinician access: check clinician_patient_relationships table
    if current_user.role == "clinician":
        now = datetime.datetime.utcnow()
        relationship = (
            db.query(ClinicianPatientRelationship)
            .filter(
                ClinicianPatientRelationship.clinician_id == current_user.id,
                ClinicianPatientRelationship.patient_id == patient_id,
                ClinicianPatientRelationship.status == "active",
            )
            .first()
        )
        if relationship:
            # Check temporal expiration if specified
            if relationship.authorized_until and relationship.authorized_until < now:
                raise ForbiddenException(
                    "Clinician care relationship with this patient has expired. Re-authorization required."
                )
            return True

        raise ForbiddenException(
            "Access denied: No active approved clinical care relationship exists with this patient."
        )

    # 4. Deny-by-default
    raise ForbiddenException("Access denied: You do not have permission to view or modify this patient's records.")
