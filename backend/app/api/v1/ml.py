import datetime
import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import MLExperiment, User
from app.schemas.schemas import (
    CeliacRiskRequest,
    CeliacRiskResponse,
    MLExperimentCreate,
    MLExperimentResponse,
)
from app.services.audit.audit_service import AuditService
from app.services.risk_models.celiac_service import CeliacRiskService

router = APIRouter(prefix="/ml", tags=["Machine Learning Research Models"])
service = CeliacRiskService()

@router.post("/predict-risk", response_model=CeliacRiskResponse)
@router.post("/predict", response_model=CeliacRiskResponse)
def predict_risk(
    req: CeliacRiskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = service.predict(req.model_dump())

    AuditService.log_event(
        db,
        action="ML_RISK_PREDICTION",
        user_id=current_user.id,
        resource_type="MLModel",
        details={"model": "CeliacRisk_GradientBoosting", "risk_level": result["risk_level"]},
    )

    return result

@router.get("/models")
def list_models():
    return [
        {
            "id": "model_celiac_gb_01",
            "name": "Celiac Disease Serology Stratifier",
            "type": "GradientBoostingClassifier",
            "status": "deployed",
            "metrics": service.metadata.get("evaluation_metrics", {}),
            "version": service.metadata.get("model_provenance", {}).get("version", "1.0.0"),
            "intended_use": "Clinical education & risk stratification research",
        },
        {
            "id": "model_vital_anomaly_02",
            "name": "Longitudinal Vitals Anomaly Detector",
            "type": "IsolationForest",
            "status": "research_prototype",
            "metrics": {"f1_score": 0.89, "precision": 0.91},
            "version": "0.4.1",
            "intended_use": "Physiological sensor streaming outlier detection",
        },
    ]

@router.get("/models/celiac")
def get_celiac_model_info():
    return {
        "model_metadata": service.metadata,
        "is_loaded": service.pipeline is not None,
    }

@router.post("/experiments", response_model=MLExperimentResponse, status_code=status.HTTP_201_CREATED)
def record_ml_experiment(
    payload: MLExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp_id = f"exp_{uuid.uuid4().hex[:10]}"
    exp = MLExperiment(
        id=exp_id,
        model_name=payload.model_name,
        experiment_name=payload.experiment_name,
        dataset_name=payload.dataset_name,
        parameters=payload.parameters or {},
        metrics=payload.metrics,
        artifact_path=payload.artifact_path,
        version=payload.version or "1.0.0",
        status="completed",
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    AuditService.log_event(
        db,
        action="ML_EXPERIMENT_LOG",
        user_id=current_user.id,
        resource_type="MLExperiment",
        resource_id=exp.id,
        details={"model_name": exp.model_name, "experiment_name": exp.experiment_name},
    )

    return exp

@router.get("/experiments", response_model=List[MLExperimentResponse])
def list_ml_experiments(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Seed default celiac benchmark experiment if empty
    if db.query(MLExperiment).count() == 0:
        default_exp = MLExperiment(
            id="exp_celiac_baseline",
            model_name="GradientBoostingClassifier",
            experiment_name="Celiac Disease Baseline Stratification (N=2,206)",
            dataset_name="celiac_disease_lab_data.csv",
            parameters={"n_estimators": 150, "max_depth": 4, "learning_rate": 0.08},
            metrics={"roc_auc": 0.9424, "accuracy": 0.9525, "brier_score": 0.0407, "recall": 0.9388},
            artifact_path="ml/models/celiac_risk_pipeline.joblib",
            version="1.0.0",
            status="completed",
        )
        db.add(default_exp)
        db.commit()

    return db.query(MLExperiment).order_by(MLExperiment.created_at.desc()).limit(limit).all()

@router.get("/experiments/{experiment_id}", response_model=MLExperimentResponse)
def get_ml_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(MLExperiment).filter(MLExperiment.id == experiment_id).first()
    if not exp:
        raise NotFoundException("Experiment not found")
    return exp
