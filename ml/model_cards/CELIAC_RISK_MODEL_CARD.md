# MediPredict AI — Machine Learning Model Card: Celiac Disease Screening Model

## 1. Model Details
- **Model Name:** Celiac Disease Risk Stratification Model (Gradient Boosting Classifier)
- **Model Version:** 1.0.0
- **Model Type:** Scikit-Learn Supervised Tabular Classifier (`GradientBoostingClassifier` with `StandardScaler` and `OneHotEncoder`)
- **Developer:** MediPredict AI Clinical Informatics & Data Science Team
- **Date:** October 2026
- **License:** Research & Educational Use Only (CC-BY-NC 4.0)

## 2. Intended Use & Clinical Scope
- **Intended Purpose:** To assist medical researchers and qualified clinicians in stratifying potential celiac disease risk based on routine serological markers (IgA, IgG, IgM) and common clinical manifestations (diarrhea, abdominal pain, short stature, weight loss, diabetes).
- **Out-of-Scope Use:**
  - **NOT** an autonomous diagnostic system.
  - **NOT** a replacement for endoscopic duodenal biopsy (Marsh classification) or confirmatory IgA tissue transglutaminase (tTG-IgA) / endomysial antibody (EMA) serology.
  - Must **NEVER** be used to initiate gluten-free diet intervention without physician oversight.

## 3. Training & Evaluation Data
- **Dataset:** Celiac Disease Clinical & Laboratory Records (N = 2,206 patient records).
- **Split:** 80% Train (1,764 samples), 20% Holdout Test (442 samples), stratified on target.
- **Cross-Validation:** 5-Fold Stratified Cross-Validation on training split.
- **Input Features (12):**
  - Continuous: `Age` (years), `IgA` (g/L), `IgG` (g/L), `IgM` (g/L).
  - Categorical: `Gender`, `Diabetes` (Yes/No), `Diabetes Type` (Type 1, Type 2, None), `Diarrhoea` (inflammatory, fatty, watery, no), `Abdominal` (yes/no), `Short_Stature` (PSS, Variant, no), `Sticky_Stool` (yes/no), `Weight_loss` (yes/no).
- **Target Variable:** `Disease_Diagnose` (Binary: confirmed positive / negative).

## 4. Evaluated Performance Metrics (Holdout Test Set)
- **CV ROC-AUC:** 0.9579 ± 0.0151
- **Test Set ROC-AUC:** 0.9424
- **Test Accuracy:** 95.25%
- **Test Precision (Positive):** 97.23%
- **Test Recall (Positive):** 97.23%
- **Brier Score (Calibration):** 0.0407 (values closer to 0 indicate well-calibrated probabilities)

## 5. Algorithmic Comparison
| Model Algorithm | 5-Fold CV ROC-AUC | Test ROC-AUC | Test Accuracy | Brier Score |
| :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Baseline)** | 0.9253 ± 0.0115 | 0.8725 | 94.80% | 0.0542 |
| **Random Forest (100 trees, depth 6)** | 0.9497 ± 0.0177 | 0.9362 | 95.70% | 0.0419 |
| **Gradient Boosting (Selected)** | **0.9579 ± 0.0151** | **0.9424** | **95.25%** | **0.0407** |

## 6. Limitations, Bias & Safety Considerations
1. **Selection Bias:** The dataset reflects patients referred for gastrointestinal or autoimmune evaluation. General population screening may yield a lower positive predictive value due to lower baseline prevalence.
2. **Selective IgA Deficiency:** Approximately 2–3% of celiac patients have selective IgA deficiency, which can cause false-negative IgA tests. Total serum IgA must be reviewed alongside IgG markers.
3. **Gluten Ingestion Status:** Patients already adhering to a gluten-free diet before testing may exhibit normalized antibody levels and false-negative risk estimations.
4. **Clinical Verification Requirement:** Every prediction output surfaces confidence intervals, individual feature contributions, and an explicit recommendation for specialist consultation.
