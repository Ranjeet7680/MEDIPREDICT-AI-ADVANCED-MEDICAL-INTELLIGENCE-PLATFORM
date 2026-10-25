import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import (
    AuditEvent,
    Conversation,
    HealthMeasurement,
    MedicalReport,
    User,
)
from app.schemas.schemas import AdminStatsResponse, UserResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["Platform Administration"])


def verify_admin(user: User):
    if user.role != "admin":
        raise ForbiddenException("Administrator privileges required.")


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_admin(current_user)

    total_users = db.query(User).count()
    total_reports = db.query(MedicalReport).count()
    total_measurements = db.query(HealthMeasurement).count()
    total_conversations = db.query(Conversation).count()
    total_audit_events = db.query(AuditEvent).count()

    AuditService.log_event(
        db,
        action="ADMIN_VIEW_DASHBOARD",
        user_id=current_user.id,
        resource_type="SystemStats",
        details={"total_users": total_users, "total_reports": total_reports},
    )

    return AdminStatsResponse(
        total_users=total_users,
        total_reports=total_reports,
        total_measurements=total_measurements,
        total_conversations=total_conversations,
        total_audit_events=total_audit_events,
        database_status="healthy",
        ai_provider=settings.AI_PROVIDER,
    )


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_admin(current_user)

    q = db.query(AuditEvent)
    if action_filter:
        q = q.filter(AuditEvent.action == action_filter)

    events = q.order_by(AuditEvent.timestamp.desc()).limit(limit).all()

    results = []
    for ev in events:
        user = db.query(User).filter(User.id == ev.user_id).first() if ev.user_id else None
        results.append({
            "id": ev.id,
            "action": ev.action,
            "resource_type": ev.resource_type,
            "resource_id": ev.resource_id,
            "details": ev.details,
            "ip_address": ev.ip_address,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
            "user_email": user.email if user else "System/Anonymous",
            "user_name": user.full_name if user else "System",
        })

    return results


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_admin(current_user)
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return users


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str = Query(..., pattern="^(patient|clinician|researcher|admin)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")

    user.role = new_role
    db.commit()

    AuditService.log_event(
        db,
        action="ADMIN_UPDATE_USER_ROLE",
        user_id=current_user.id,
        resource_type="User",
        resource_id=str(user.id),
        details={"new_role": new_role},
    )

    return {"message": f"User {user.email} updated to {new_role}"}
