"""
MediPredict AI - Medical Machine Learning Research Pipeline
Disease Risk Estimation Module: Celiac Disease Screening Lab Model

Dataset: Celiac Disease Clinical & Laboratory Records (N=2206)
Target: Disease_Diagnose (Binary: yes / no)
Features: Demographic, clinical signs/symptoms, and serological immunoglobulins (IgA, IgG, IgM).
Notice: Intended for exploratory medical science research only.
NOT FOR CLINICAL DIAGNOSIS WITHOUT PROFESSIONAL MEDICAL WORKUP.
"""

import json
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

def train_and_evaluate():
    data_path = Path(__file__).parent.parent / "datasets" / "celiac_disease_lab_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Clean missing values for Diabetes Type
    df["Diabetes Type"] = df["Diabetes Type"].fillna("None")

    # Features and target
    feature_cols = [
        "Age",
        "Gender",
        "Diabetes",
        "Diabetes Type",
        "Diarrhoea",
        "Abdominal",
        "Short_Stature",
        "Sticky_Stool",
        "Weight_loss",
        "IgA",
        "IgG",
        "IgM",
    ]
    target_col = "Disease_Diagnose"

    X = df[feature_cols].copy()
    y = (df[target_col].str.strip().str.lower() == "yes").astype(int)

    numeric_features = ["Age", "IgA", "IgG", "IgM"]
    categorical_features = [
        "Gender",
        "Diabetes",
        "Diabetes Type",
        "Diarrhoea",
        "Abdominal",
        "Short_Stature",
        "Sticky_Stool",
        "Weight_loss",
    ]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
        ]
    )

    # Split dataset into train and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    print(f"Train positive rate: {y_train.mean():.4f}, Test positive rate: {y_test.mean():.4f}")

    # Compare Baseline vs Gradient Boosting
    models = {
        "LogisticRegression_Baseline": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42),
    }

    best_pipeline = None
    best_auc = 0.0
    best_name = ""
    results_summary = {}

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in models.items():
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        auc = roc_auc_score(y_test, y_prob)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        brier = brier_score_loss(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        results_summary[name] = {
            "cv_auc_mean": float(np.mean(cv_scores)),
            "cv_auc_std": float(np.std(cv_scores)),
            "test_auc": float(auc),
            "test_accuracy": float(acc),
            "test_precision": float(prec),
            "test_recall": float(rec),
            "test_f1": float(f1),
            "brier_score": float(brier),
            "confusion_matrix": cm,
        }

        print(f"\nModel: {name}")
        print(f"  CV ROC-AUC: {np.mean(cv_scores):.4f} +/- {np.std(cv_scores):.4f}")
        print(f"  Test ROC-AUC: {auc:.4f} | Accuracy: {acc:.4f} | F1: {f1:.4f} | Brier: {brier:.4f}")

        if auc > best_auc:
            best_auc = auc
            best_pipeline = pipeline
            best_name = name

    # Save artifact
    output_dir = Path(__file__).parent.parent / "models"
    output_dir.mkdir(parents=True, exist_ok=True)
    model_file = output_dir / "celiac_risk_pipeline.joblib"
    meta_file = output_dir / "celiac_risk_metadata.json"

    joblib.dump(best_pipeline, model_file)

    metadata = {
        "model_name": best_name,
        "version": "1.0.0",
        "dataset_name": "Celiac Disease Serology & Clinical Manifestations",
        "sample_count": len(df),
        "features": feature_cols,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "metrics": results_summary[best_name],
        "all_model_evaluations": results_summary,
        "license": "Open Medical Research Data / CC-BY-NC 4.0",
        "clinical_limitation": (
            "Screening tool for exploratory risk stratification. Must not be used as a standalone "
            "diagnostic device. Clinical confirmation requires anti-tTG IgA / EMA antibody testing "
            "and small bowel endoscopic biopsy interpreted by a licensed gastroenterologist."
        ),
    }

    with open(meta_file, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[SUCCESS] Best model '{best_name}' saved to {model_file}")
    print(f"Saved metadata to {meta_file}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
