from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.models import (
    DiseaseCondition,
    GeneAssociation,
    MedicalReference,
    PersonalRecord,
    User,
)
from app.schemas.schemas import UnifiedSearchResult

router = APIRouter(prefix="/search", tags=["Unified Search"])

@router.get("", response_model=List[UnifiedSearchResult])
def unified_search(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query_str = f"%{q.strip().lower()}%"
    results = []

    # 1. Search Diseases
    diseases = (
        db.query(DiseaseCondition)
        .filter(
            or_(
                DiseaseCondition.name.ilike(query_str),
                DiseaseCondition.summary.ilike(query_str),
                DiseaseCondition.specialty.ilike(query_str),
            )
        )
        .limit(5)
        .all()
    )
    for d in diseases:
        results.append(
            UnifiedSearchResult(
                category="Disease",
                id=d.id,
                title=d.name,
                subtitle=f"{d.specialty} • Evidence-based summary",
                link="/diseases",
            )
        )

    # 2. Search Genes
    genes = (
        db.query(GeneAssociation)
        .filter(
            or_(
                GeneAssociation.gene_symbol.ilike(query_str),
                GeneAssociation.gene_name.ilike(query_str),
                GeneAssociation.associated_condition.ilike(query_str),
            )
        )
        .limit(5)
        .all()
    )
    for g in genes:
        results.append(
            UnifiedSearchResult(
                category="Genetics",
                id=g.id,
                title=f"{g.gene_symbol} ({g.gene_name})",
                subtitle=f"{g.associated_condition} • {g.inheritance_pattern}",
                link="/genetics",
            )
        )

    # 3. Search Medical Literature
    references = (
        db.query(MedicalReference)
        .filter(
            or_(
                MedicalReference.title.ilike(query_str),
                MedicalReference.abstract.ilike(query_str),
                MedicalReference.pmid.ilike(query_str),
            )
        )
        .limit(5)
        .all()
    )
    for r in references:
        results.append(
            UnifiedSearchResult(
                category="Research",
                id=r.id,
                title=r.title,
                subtitle=f"{r.journal or 'Medical Ref'} ({r.publication_year or '2024'}) • PMID: {r.pmid or 'N/A'}",
                link="/research",
            )
        )

    # 4. Search User's Personal Records
    user_records = (
        db.query(PersonalRecord)
        .filter(
            PersonalRecord.user_id == current_user.id,
            or_(
                PersonalRecord.title.ilike(query_str),
                PersonalRecord.summary.ilike(query_str),
            ),
        )
        .limit(5)
        .all()
    )
    for rec in user_records:
        results.append(
            UnifiedSearchResult(
                category="Health Record",
                id=rec.id,
                title=rec.title,
                subtitle=f"{rec.category} • {rec.doctor_or_facility or 'Personal Vault'}",
                link="/records",
            )
        )

    return results
