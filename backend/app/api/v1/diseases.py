from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import DiseaseCondition, User
from app.schemas.schemas import DiseaseConditionResponse

router = APIRouter(prefix="/diseases", tags=["Disease Research Explorer"])

@router.get("", response_model=List[DiseaseConditionResponse])
def list_diseases(
    specialty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(DiseaseCondition)
    if specialty:
        q = q.filter(DiseaseCondition.specialty.ilike(f"%{specialty}%"))
    if search:
        q = q.filter(
            (DiseaseCondition.name.ilike(f"%{search}%"))
            | (DiseaseCondition.summary.ilike(f"%{search}%"))
        )
    return q.all()

@router.get("/{disease_id}", response_model=DiseaseConditionResponse)
def get_disease(disease_id: int, db: Session = Depends(get_db)):
    disease = db.query(DiseaseCondition).filter(DiseaseCondition.id == disease_id).first()
    if not disease:
        raise NotFoundException("Medical condition not found")
    return disease
