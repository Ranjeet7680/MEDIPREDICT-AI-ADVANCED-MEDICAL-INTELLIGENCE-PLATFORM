from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import GeneAssociation
from app.schemas.schemas import GeneAssociationResponse

router = APIRouter(prefix="/genes", tags=["Genetics Explorer"])

@router.get("", response_model=List[GeneAssociationResponse])
def list_genes(
    symbol: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(GeneAssociation)
    if symbol:
        q = q.filter(GeneAssociation.gene_symbol.ilike(f"%{symbol}%"))
    if condition:
        q = q.filter(GeneAssociation.associated_condition.ilike(f"%{condition}%"))
    return q.all()

@router.get("/{gene_id}", response_model=GeneAssociationResponse)
def get_gene(gene_id: int, db: Session = Depends(get_db)):
    gene = db.query(GeneAssociation).filter(GeneAssociation.id == gene_id).first()
    if not gene:
        raise NotFoundException("Genetic marker not found")
    return gene
