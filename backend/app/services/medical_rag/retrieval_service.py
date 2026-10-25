from typing import Any, Dict, List
from sqlalchemy.orm import Session
from app.models.models import MedicalReference

class MedicalRAGService:
    @staticmethod
    def retrieve_evidence(db: Session, query: str, limit: int = 4) -> List[Dict[str, Any]]:
        query_words = [w.strip().lower() for w in query.split() if len(w.strip()) > 3]
        if not query_words:
            # Return top default references
            refs = db.query(MedicalReference).limit(limit).all()
        else:
            # Query matching title, abstract, or category
            filters = []
            for word in query_words[:3]:
                filters.append(MedicalReference.title.ilike(f"%{word}%"))
                filters.append(MedicalReference.abstract.ilike(f"%{word}%"))
                filters.append(MedicalReference.key_findings.ilike(f"%{word}%"))
                filters.append(MedicalReference.category.ilike(f"%{word}%"))

            from sqlalchemy import or_
            refs = db.query(MedicalReference).filter(or_(*filters)).limit(limit).all()

            if not refs:
                refs = db.query(MedicalReference).limit(limit).all()

        results = []
        for r in refs:
            results.append({
                "title": r.title,
                "authors": r.authors,
                "journal": r.journal,
                "year": r.publication_year,
                "pmid": r.pmid,
                "doi": r.doi,
                "evidence_level": r.evidence_level,
                "url": r.url,
                "abstract": r.abstract,
            })
        return results
