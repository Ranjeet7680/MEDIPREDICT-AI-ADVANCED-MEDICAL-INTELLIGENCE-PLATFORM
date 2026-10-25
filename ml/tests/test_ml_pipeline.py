import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

def test_model_files_exist():
    base_dir = Path(__file__).parent.parent / "models"
    model_path = base_dir / "celiac_risk_pipeline.joblib"
    meta_path = base_dir / "celiac_risk_metadata.json"

    assert model_path.exists(), f"Model file missing at {model_path}"
    assert meta_path.exists(), f"Metadata file missing at {meta_path}"

def test_model_predictions_shape_and_bounds():
    base_dir = Path(__file__).parent.parent / "models"
    model_path = base_dir / "celiac_risk_pipeline.joblib"
    pipeline = joblib.load(model_path)

    # Test sample with positive profile
    sample_data = pd.DataFrame([{
        "Age": 24,
        "Gender": "Female",
        "Diabetes": "Yes",
        "Diabetes Type": "Type 1",
        "Diarrhoea": "inflammatory",
        "Abdominal": "yes",
        "Short_Stature": "no",
        "Sticky_Stool": "yes",
        "Weight_loss": "yes",
        "IgA": 2.8,
        "IgG": 14.2,
        "IgM": 1.1,
    }])

    prob = pipeline.predict_proba(sample_data)[0, 1]
    assert 0.0 <= prob <= 1.0, f"Probability {prob} out of bounds"

    pred = pipeline.predict(sample_data)[0]
    assert pred in [0, 1]

def test_metadata_metrics():
    meta_path = Path(__file__).parent.parent / "models" / "celiac_risk_metadata.json"
    with open(meta_path) as f:
        meta = json.load(f)

    metrics = meta.get("metrics", {})
    assert metrics.get("test_auc", 0) >= 0.85, "Test AUC should exceed 0.85"
    assert metrics.get("test_accuracy", 0) >= 0.90, "Test accuracy should exceed 0.90"
    assert "clinical_limitation" in meta
