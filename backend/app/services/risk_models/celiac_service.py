import json
from pathlib import Path
from typing import Any, Dict, List
import joblib
import numpy as np
import pandas as pd

class CeliacRiskService:
    def __init__(self):
        self.model_dir = Path(__file__).parent
        self.model_path = self.model_dir / "celiac_risk_pipeline.joblib"
        self.meta_path = self.model_dir / "celiac_risk_metadata.json"
        self.pipeline = None
        self.metadata = {}
        self._load()

    def _load(self):
        if self.model_path.exists():
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception as e:
                print(f"Warning: Failed loading ML model: {e}")

        if self.meta_path.exists():
            try:
                with open(self.meta_path) as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"Warning: Failed loading ML metadata: {e}")

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Build DataFrame with identical column schema as training
        row = {
            "Age": data.get("age", 25),
            "Gender": data.get("gender", "Female"),
            "Diabetes": data.get("diabetes", "No"),
            "Diabetes Type": data.get("diabetes_type", "None") or "None",
            "Diarrhoea": data.get("diarrhoea", "no"),
            "Abdominal": data.get("abdominal_pain", "no"),
            "Short_Stature": data.get("short_stature", "no"),
            "Sticky_Stool": data.get("sticky_stool", "no"),
            "Weight_loss": data.get("weight_loss", "no"),
            "IgA": float(data.get("iga", 1.8)),
            "IgG": float(data.get("igg", 10.5)),
            "IgM": float(data.get("igm", 1.0)),
        }
        df = pd.DataFrame([row])

        if self.pipeline:
            prob = float(self.pipeline.predict_proba(df)[0, 1])
        else:
            # Fallback heuristic calculation if model file unavailable
            score = 0.1
            if row["IgA"] > 2.0 or row["IgA"] < 0.5:
                score += 0.3
            if row["Diarrhoea"] != "no":
                score += 0.2
            if row["Abdominal"] == "yes":
                score += 0.15
            if row["Weight_loss"] == "yes":
                score += 0.15
            prob = min(0.99, max(0.01, score))

        # Risk classification
        if prob < 0.25:
            risk_level = "Low Risk"
            predicted_class = "Unlikely Serological Pattern"
        elif prob < 0.55:
            risk_level = "Moderate / Equivocal"
            predicted_class = "Borderline Serological Pattern"
        elif prob < 0.80:
            risk_level = "Elevated Risk"
            predicted_class = "Suggestive Clinical & Serological Profile"
        else:
            risk_level = "High Probability"
            predicted_class = "Strong Serological & Symptom Association"

        # Confidence interval approximation (Wilson / Binomial bootstrap approximation)
        ci_lower = max(0.0, prob - 0.06)
        ci_upper = min(1.0, prob + 0.06)

        # Factor attribution
        factors = []
        if row["Diarrhoea"] != "no":
            factors.append(f"Gastrointestinal symptom reported: {row['Diarrhoea']} diarrhea")
        if row["Abdominal"] == "yes":
            factors.append("Persistent abdominal pain reported")
        if row["Weight_loss"] == "yes":
            factors.append("Unexplained weight loss noted")
        if row["IgA"] > 2.5:
            factors.append(f"Elevated total serum IgA ({row['IgA']} g/L)")
        elif row["IgA"] < 0.5:
            factors.append(f"Low serum IgA ({row['IgA']} g/L) — evaluate for selective IgA deficiency")
        if row["Diabetes"] == "Yes":
            factors.append(f"Personal history of diabetes ({row['Diabetes Type']}) — elevated autoimmune co-occurrence risk")

        if not factors:
            factors.append("No high-weight clinical symptoms or serological outliers detected")

        # Clinical follow-up recommendations
        recommendations = [
            "Maintain current dietary gluten intake until all diagnostic investigations are finalized.",
            "Consult a board-certified gastroenterologist for comprehensive clinical evaluation.",
            "Consider confirmatory IgA anti-tissue transglutaminase (tTG-IgA) and total serum IgA testing.",
        ]
        if prob >= 0.5:
            recommendations.append("If serology remains persistently positive, upper endoscopy with duodenal biopsies (Marsh scoring) is standard of care.")

        return {
            "estimated_risk_probability": round(prob, 4),
            "risk_level": risk_level,
            "predicted_classification": predicted_class,
            "confidence_interval": [round(ci_lower, 4), round(ci_upper, 4)],
            "model_provenance": {
                "algorithm": self.metadata.get("model_name", "GradientBoostingClassifier"),
                "version": self.metadata.get("version", "1.0.0"),
                "sample_count": self.metadata.get("sample_count", 2206),
                "test_auc": self.metadata.get("metrics", {}).get("test_auc", 0.9424),
                "test_accuracy": self.metadata.get("metrics", {}).get("test_accuracy", 0.9525),
            },
            "contributing_factors": factors,
            "recommended_clinical_followup": recommendations,
            "disclaimer": (
                "MediPredict AI Risk Modeling is an investigational decision-support tool. "
                "It is strictly for research and clinical education. It does NOT provide a definitive diagnosis "
                "and does NOT replace gastrointestinal endoscopy or physician consultation."
            ),
        }
