from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import MedicalReference, ResearchBookmark, User
from app.schemas.schemas import BookmarkCreate, BookmarkResponse, MedicalReferenceResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/research", tags=["Medical Research Library"])

@router.get("/search", response_model=List[MedicalReferenceResponse])
def search_research(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(MedicalReference)
    if category:
        query = query.filter(MedicalReference.category.ilike(f"%{category}%"))
    if q:
        query = query.filter(
            (MedicalReference.title.ilike(f"%{q}%"))
            | (MedicalReference.abstract.ilike(f"%{q}%"))
            | (MedicalReference.key_findings.ilike(f"%{q}%"))
            | (MedicalReference.pmid.ilike(f"%{q}%"))
        )
    return query.limit(limit).all()

@router.get("/bookmarks", response_model=List[BookmarkResponse])
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(ResearchBookmark)
        .filter(ResearchBookmark.user_id == current_user.id)
        .order_by(ResearchBookmark.created_at.desc())
        .all()
    )
    result = []
    for b in bookmarks:
        item = BookmarkResponse.model_validate(b)
        if b.reference:
            item.reference = MedicalReferenceResponse.model_validate(b.reference)
        result.append(item)
    return result

@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    bookmark_in: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ref = db.query(MedicalReference).filter(MedicalReference.id == bookmark_in.reference_id).first()
    if not ref:
        raise NotFoundException("Medical reference paper not found")

    existing = (
        db.query(ResearchBookmark)
        .filter(
            ResearchBookmark.user_id == current_user.id,
            ResearchBookmark.reference_id == bookmark_in.reference_id,
        )
        .first()
    )
    if existing:
        res = BookmarkResponse.model_validate(existing)
        res.reference = MedicalReferenceResponse.model_validate(ref)
        return res

    b = ResearchBookmark(
        user_id=current_user.id,
        reference_id=bookmark_in.reference_id,
        notes=bookmark_in.notes,
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    AuditService.log_event(
        db,
        action="BOOKMARK_RESEARCH",
        user_id=current_user.id,
        resource_type="ResearchBookmark",
        resource_id=str(b.id),
    )

    res = BookmarkResponse.model_validate(b)
    res.reference = MedicalReferenceResponse.model_validate(ref)
    return res

@router.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = (
        db.query(ResearchBookmark)
        .filter(ResearchBookmark.id == bookmark_id, ResearchBookmark.user_id == current_user.id)
        .first()
    )
    if not b:
        raise NotFoundException("Bookmark not found")

    db.delete(b)
    db.commit()
    return {"message": "Bookmark removed"}
