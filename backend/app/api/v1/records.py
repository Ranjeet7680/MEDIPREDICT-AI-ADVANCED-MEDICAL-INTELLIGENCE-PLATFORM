import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import PersonalRecord, User
from app.schemas.schemas import PersonalRecordCreate, PersonalRecordResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/records", tags=["Personal Health Records"])

@router.get("", response_model=List[PersonalRecordResponse])
def list_records(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(PersonalRecord).filter(PersonalRecord.user_id == current_user.id)
    if category:
        q = q.filter(PersonalRecord.category.ilike(f"%{category}%"))
    return q.order_by(PersonalRecord.record_date.desc()).all()

@router.post("", response_model=PersonalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    rec_in: PersonalRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = PersonalRecord(
        user_id=current_user.id,
        title=rec_in.title,
        category=rec_in.category or "Clinical Consultation",
        record_date=rec_in.record_date or datetime.datetime.utcnow(),
        doctor_or_facility=rec_in.doctor_or_facility,
        summary=rec_in.summary,
        tags=rec_in.tags or [],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    AuditService.log_event(
        db,
        action="CREATE_PERSONAL_RECORD",
        user_id=current_user.id,
        resource_type="PersonalRecord",
        resource_id=str(record.id),
    )
    return record

@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = db.query(PersonalRecord).filter(PersonalRecord.id == record_id).first()
    if not rec:
        raise NotFoundException("Personal record not found")
    if rec.user_id != current_user.id:
        raise ForbiddenException()

    db.delete(rec)
    db.commit()
    return {"message": "Record deleted successfully"}
