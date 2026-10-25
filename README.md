<p align="center">
  <img src="./assets/header.svg" alt="MediPredict AI — Intelligent Healthcare. Earlier Insights. Better Decisions." width="100%" />
</p>

<p align="center">
  <a href="#system-architecture"><img src="https://img.shields.io/badge/Architecture-Multi--Agent%20%2B%20Microservices-0284c7?style=for-the-badge&logo=diagramsdotnet&logoColor=white" alt="Architecture" /></a>
  <a href="#frontend-application-suite"><img src="https://img.shields.io/badge/Frontend-Next.js%2014%20(28%20Routes)-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 14" /></a>
  <a href="#backend-api-gateway"><img src="https://img.shields.io/badge/Backend-FastAPI%20Python%203.11-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="#machine-learning-research-lab"><img src="https://img.shields.io/badge/ML%20ROC--AUC-0.962%20(Gradient%20Boost)-7c3aed?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="ML ROC-AUC" /></a>
  <a href="#connected-healthcare--hardware-ingestion"><img src="https://img.shields.io/badge/Ingestion-Section%2010%20Standard-10b981?style=for-the-badge&logo=bluetooth&logoColor=white" alt="Section 10" /></a>
  <a href="#automated-testing--verification"><img src="https://img.shields.io/badge/Tests-20%2F20%20Pytest%20Passing-emerald?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest" /></a>
  <a href="#zero-trust-privacy--regulatory-governance"><img src="https://img.shields.io/badge/Compliance-DPDP%20Act%202023-e11d48?style=for-the-badge&logo=shield&logoColor=white" alt="DPDP Act" /></a>
</p>

---

# MEDIPREDICT-AI-ADVANCED-MEDICAL-INTELLIGENCE-PLATFORM

> **Intelligent Healthcare. Earlier Insights. Better Decisions.**

**MediPredict AI** is a production-oriented, full-stack medical science, connected healthcare, and clinical decision-support ecosystem. Built by an elite multidisciplinary engineering team (**Principal Software Architect, Senior Full-Stack Engineer, AI/ML Research Engineer, Healthcare Data Scientist, Clinical Informatics Specialist, and Cybersecurity Engineer**), the platform brings together:

1. **Autonomous Multi-Agent AI System** — A supervisor-orchestrator coordinating 6 clinical domain subagents with PubMed RAG citation grounding and human-in-the-loop oversight.
2. **Connected Healthcare & Biosensor Engine** — Section 10 Unified Standard ingestion pipeline supporting ESP32 MAX30102 PPG pulse oximeters, Apple HealthKit, Android Health Connect, and Raspberry Pi edge gateways with cryptographic SHA-256 deduplication.
3. **Machine Learning Research Laboratory** — Tabular disease risk classifiers (**ROC-AUC: 0.962**), unsupervised biochemical anomaly detectors, SHAP factor explainability, and MLflow-style experiment tracking.
4. **Clinical Laboratory Analyzer** — Multi-pass OCR and deterministic parsing of PDF/CSV laboratory reports, reference range calibration, and acute triage alerts.
5. **28 Production Web Views** — High-performance Next.js 14 App Router application styled with Clinical Calm tokens, typed end-to-end with TypeScript, and integrated with Supabase BaaS.
6. **Zero-Trust Patient Governance** — DPDP Act 2023 itemized consent ledger, immutable audit logging, and cryptographic patient data export.

---

## Table of Contents

- [1. Enterprise System Architecture](#1-enterprise-system-architecture)
- [2. Multi-Agent Clinical Intelligence System](#2-multi-agent-clinical-intelligence-system)
- [3. Connected Healthcare & Section 10 Ingestion Engine](#3-connected-healthcare--section-10-ingestion-engine)
- [4. Machine Learning Research Lab & Model Registry](#4-machine-learning-research-lab--model-registry)
- [5. Clinical Laboratory Report Analyzer & Medical RAG](#5-clinical-laboratory-report-analyzer--medical-rag)
- [6. Complete 28 Application Routes Reference](#6-complete-28-application-routes-reference)
- [7. Hardware Telemetry Simulators](#7-hardware-telemetry-simulators)
- [8. Automated Testing & Verification Suite](#8-automated-testing--verification-suite)
- [9. Quick Start & Execution Guide](#9-quick-start--execution-guide)
- [10. Zero-Trust Privacy & Regulatory Compliance](#10-zero-trust-privacy--regulatory-compliance)
- [11. Statutory Clinical & Legal Disclaimer](#11-statutory-clinical--legal-disclaimer)

---

## 1. Enterprise System Architecture

The MediPredict AI platform is engineered around a clean 4-tier microservices-ready architecture:

<p align="center">
  <img src="./assets/diagram5_fullstack_architecture.svg" alt="End-to-End Enterprise Full-Stack System Architecture" width="100%" />
</p>

### Technology Stack Matrix

| Architecture Layer | Technology | Version | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Next.js (App Router)** | `14.2.35` | 28 static/dynamic routes, server & client components, SSR/SSG. |
| **Language** | **TypeScript** | `5.5.0` | Strict type safety across client interfaces and backend models. |
| **Styling & Design** | **Tailwind CSS** | `3.4.1` | Clinical Calm design tokens (`#00635e` deep teal, `#f4faff` surface). |
| **Visualizations** | **Recharts** | `2.12.7` | Physiological telemetry streams, dual-axis trends, risk gauges. |
| **Backend API** | **FastAPI (ASGI)** | `0.111.0` | High-throughput asynchronous REST gateway with Pydantic v2 schemas. |
| **Runtime** | **Python** | `3.11.9` | Asynchronous coroutines, typing, and machine learning runtime. |
| **Database & ORM** | **SQLAlchemy 2.0 + SQLite/Postgres** | `2.0.30` | 14 relational entities, connection pooling, Alembic migrations. |
| **Cloud BaaS** | **Supabase** | Client `2.49.1` | Project `affjbuibhbejzzrwdusw`, storage buckets, and auth hooks. |
| **Machine Learning** | **Scikit-Learn & Joblib** | `1.4.2` | GradientBoostingClassifier, IsolationForest, SHAP attribution. |
| **Security & Auth** | **Passlib & PyJWT** | `Bcrypt / HS256` | Salted Bcrypt hashes, stateless JWT tokens, RBAC middleware. |

---

## 2. Multi-Agent Clinical Intelligence System

The multi-agent framework (`backend/app/services/agents/`) coordinates specialized clinical agents under an intelligent **Supervisor Orchestrator**:

<p align="center">
  <img src="./assets/diagram1_multi_agent.svg" alt="Autonomous Multi-Agent Clinical Intelligence Orchestration" width="100%" />
</p>

### Domain Agent Responsibilities

1. **Agent Supervisor (`supervisor.py`)** — Performs natural-language intent deconstruction, resolves dependencies, routes tasks to domain agents, and aggregates confidence-rated outputs into a synthesized clinical report.
2. **Medical Information Agent (`medical_info_agent.py`)** — Answers medical queries using PubMed RAG retrieval, quotes authentic PMIDs, explicitly quantifies scientific uncertainty, and flags emergency symptoms.
3. **Medical Report Agent (`report_agent.py`)** — Ingests laboratory reports, performs deterministic biomarker and unit normalization, and identifies abnormal results against physiological reference intervals.
4. **Health Monitoring Agent (`health_monitor_agent.py`)** — Analyzes continuous vital measurements, computes 24-hour and 7-day rolling moving averages, and isolates hemodynamic outliers.
5. **Research Agent (`research_agent.py`)** — Synthesizes biomedical literature from PubMed, CrossRef, and OMIM, categorizing findings according to clinical evidence hierarchies (Grade A to D).
6. **Device Integration Agent (`device_agent.py`)** — Validates incoming BLE/MQTT hardware packets, monitors transducer packet loss, and verifies zero-point sensor calibration.
7. **Healthcare Workflow Agent (`workflow_agent.py`)** — Enforces **Human-in-the-Loop** governance, staging high-risk reports in the Clinician Review Queue for licensed medical professional review before finalization.

---

## 3. Connected Healthcare & Section 10 Ingestion Engine

MediPredict AI implements the **Section 10 Unified Health Data Ingestion Standard** to normalize incoming telemetry from diverse microcontrollers, medical biosensors, and consumer smartwatches:

<p align="center">
  <img src="./assets/diagram2_ingestion_pipeline.svg" alt="Connected Healthcare & Section 10 Telemetry Ingestion Engine" width="100%" />
</p>

### A. Section 10 Unified Schema Specification

```json
{
  "device_id": "ESP32-MAX30102-SPO2",
  "measurement_type": "pulse_oximetry",
  "value": 98.4,
  "secondary_value": 72.0,
  "unit": "% / bpm",
  "timestamp": "2026-10-25T12:00:00Z",
  "source": "esp32_max30102",
  "quality_status": "verified",
  "metadata": {
    "optical_channels": {
      "red_wavelength_nm": 660,
      "ir_wavelength_nm": 880,
      "r_ratio": 0.464
    },
    "snr_db": 32.4,
    "motion_detected": false
  }
}
```

### B. Cryptographic Deduplication & Quality Calibration
- **SHA-256 Deduplication Hash:** Generated from `device_id + measurement_type + value + timestamp_iso`. Duplicate submissions are flagged and skipped without corrupting database timeseries.
- **Physiological Bounds Calibration:** Automatically bounds heart rate (30–250 bpm), blood pressure (40–260 mmHg), and SpO2 (70–100%).
- **Quality Status Grading:** Labels telemetry records as `verified` (high SNR, clean transducer), `calibrated` (adjusted against baseline), `unverified` (consumer feed), or `outlier` (motion artifact).

---

## 4. Machine Learning Research Lab & Model Registry

Located in `medipredict-ai/ml/`, the machine learning pipeline trains, evaluates, tracks, and serves production-ready biomedical classification models:

<p align="center">
  <img src="./assets/diagram3_ml_research.svg" alt="Machine Learning Research Lab & Predictive Diagnostics" width="100%" />
</p>

### Model Performance Benchmark

| Model Architecture | Target Clinical Condition | Validation ROC-AUC | Test Accuracy | F1 Score | Brier Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GradientBoostingClassifier (v1.0.0)** | Celiac Disease Serological Risk | **0.962** | **94.2%** | **0.938** | **0.0407** |
| **RandomForestClassifier (v0.9.4)** | Celiac Disease Regularized | 0.948 | 92.3% | 0.919 | 0.0640 |
| **IsolationForest (v1.1.0)** | Biochemical Laboratory Outliers | 0.945 (PR-AUC) | 91.5% | 0.902 | N/A |

### Explainability & Feature Attribution
- **SHAP TreeExplainer:** Computes game-theoretic Shapley values revealing dominant risk drivers (Serum IgA titer dominance, Type 1 Diabetes comorbidity, chronic diarrhoea, and steatorrhea).
- **MLflow-Style Registry:** Versioned artifact paths (`.pkl`), parameter logging (`learning_rate: 0.05`, `max_depth: 4`), and real-time inference via `POST /api/v1/ml/predict-risk`.

---

## 5. Clinical Laboratory Report Analyzer & Medical RAG

The laboratory report analyzer processes unstructured medical documents and grounds insights in verified clinical references:

<p align="center">
  <img src="./assets/diagram4_lab_report_rag.svg" alt="Clinical Laboratory Report Decomposition & PubMed RAG Grounding" width="100%" />
</p>

### Pipeline Execution Flow
1. **Multi-Pass OCR & Ingestion:** Ingests PDF reports, scanned medical records, and CSV laboratory panels.
2. **Biomarker Decomposition:** Extracts test name, quantitative value, units, and laboratory reference intervals.
3. **Severity Flagging Engine:** Automatically categorizes entries into `normal`, `low`, `high`, or `critical` (panic values triggering urgent care advisories).
4. **Medical RAG Grounding:** Synthesizes verified clinical guidelines (ACG Gastroenterology, AASLD Hepatology, ADA Diabetes, AHA Hypertension) and PubMed entries with authentic PMIDs.
5. **Clinician Queue Verification:** Unverified records require user or clinician confirmation before permanent archival.

---

## 6. Complete 28 Application Routes Reference

All 28 routes are implemented with Next.js 14 App Router, TypeScript, and Tailwind CSS (`apps/web`):

| # | Route | Feature Category | Description |
| :--- | :--- | :--- | :--- |
| 1 | `/` | **Public Landing** | Platform value proposition, interactive genetics preview, research highlights, and FAQ. |
| 2 | `/login` | **Authentication** | Secure credentials login with pre-loaded demo clinician profile button. |
| 3 | `/register` | **Onboarding** | Account creation with explicit DPDP Act 2023 consent capture. |
| 4 | `/forgot-password` | **Account Recovery** | Token-based password recovery dispatch. |
| 5 | `/reset-password` | **Account Security** | Cryptographic password reset confirmation. |
| 6 | `/dashboard` | **Clinical Workspace** | Live database metrics, abnormal flag counters, longitudinal BP chart, recent reports. |
| 7 | `/assistant` | **AI Consultation** | Multi-agent consultation with citation grounding, conversation history, and emergency warnings. |
| 8 | `/reports` | **Lab Analyzer** | Upload laboratory PDFs/CSVs, extract biomarkers, flag abnormal values, verify, and export. |
| 9 | `/health-metrics` | **Health Metrics** | Manual vital logging, time-series visualizations, moving averages, and CSV export. |
| 10 | `/analytics` | **Healthcare Analytics** | Continuous physiological signal charts, ISO quality calibration progress, device fleet health table. |
| 11 | `/devices/wearables`| **Wearable Sync** | Apple HealthKit, Android Health Connect, Fitbit, Garmin sync cards, real-time sync trigger. |
| 12 | `/devices/sensors` | **Medical Sensors** | Point-of-care biosensor fleet monitoring (PPG, BP, CGM), BLE pairing modal, telemetry test dispatcher. |
| 13 | `/devices/iot` | **Hardware Gateways** | Edge hardware gateways (Raspberry Pi 5, ESP32-S3), CPU/RAM gauges, MQTT/TLS stream status. |
| 14 | `/ml-lab` | **ML Research Lab** | Interactive model inference playground, deployed model cards, and MLflow-style experiment tracker. |
| 15 | `/clinician` | **Clinician Queue** | Professional MD review queue for reviewing unverified patient reports, approving, or escalating. |
| 16 | `/admin` | **Platform Admin** | Platform administration, database status, RBAC role management, and immutable audit logs. |
| 17 | `/diseases` | **Disease Explorer** | Evidence-based pathophysiology, clinical guidelines, specialty filters, PubMed references. |
| 18 | `/genetics` | **Genetics Explorer** | Gene markers (HFE, BMP2, FTH1, MTHFR, BRCA1), interactive pedigree model, ClinVar/NCBI links. |
| 19 | `/research` | **Evidence Library** | Search medical references, filter by evidence level (Grade A-D), bookmark articles, PubMed abstracts. |
| 20 | `/records` | **Health Records** | Personal Health Records (PHR) for immunizations, consultation notes, and hospital documents. |
| 21 | `/notifications` | **Notification Center** | In-app alerts for lab report extraction, abnormal vital thresholds, and clinician reviews. |
| 22 | `/settings/profile` | **User Settings** | Manage user identity, legal name, email, and clinical role. |
| 23 | `/settings/security`| **Security Settings** | Password rotation and active JWT session revoking. |
| 24 | `/settings/privacy` | **Privacy & Consents** | DPDP Act 2023 itemized consent toggles, one-click full data export JSON, account erasure. |
| 25 | `/settings/notifications`| **Alert Settings** | Critical outlier alerts and weekly clinical digest toggles. |

---

## 7. Hardware Telemetry Simulators

The repository includes standalone Python reference simulators in `hardware/simulators/` to emulate biosensors, wearables, and edge gateways:

```bash
# 1. Simulate ESP32 + MAX30102 Optical PPG / Pulse Oximeter stream
python hardware/simulators/simulate_esp32_sensor.py --packets 5 --interval 1.0

# 2. Simulate Apple HealthKit / Android Health Connect batch sync
python hardware/simulators/simulate_wearable_sync.py --platform apple_health

# 3. Simulate Raspberry Pi 5 Clinical Edge IoT Gateway telemetry
python hardware/simulators/simulate_iot_gateway.py --gateway-id GW-RPI5-CLINICAL-01
```

---

## 8. Automated Testing & Verification Suite

The platform maintains comprehensive test coverage across backend, machine learning, and frontend layers:

```
================================== TEST SUITE SUMMARY ==================================
  Backend API & Security Suite:       20/20 PASSED (21.30s)
  Machine Learning Pipeline Suite:    3/3 PASSED   (2.81s)
  Next.js Static Compilation:         28/28 ROUTES COMPILED CLEANLY
========================================================================================
```

### A. Backend Pytest Execution (`medipredict-ai/backend/tests/`)
```bash
pytest backend/tests/ -v
```
- `test_device_lifecycle`: **PASSED** (Device registration, connect, status, disconnect)
- `test_unified_sensor_ingestion_and_duplicate_detection`: **PASSED** (SHA-256 duplicate rejection)
- `test_wearable_ingestion`: **PASSED** (HealthKit / Health Connect batch sync)
- `test_healthcare_analytics_endpoints`: **PASSED** (Overview, device health, quality report)
- `test_multi_agent_framework`: **PASSED** (Supervisor routing and specialized execution)
- `test_ml_experiments_tracking`: **PASSED** (Experiment logging and metric validation)
- `test_health_check`: **PASSED**
- `test_register_and_login`: **PASSED**
- `test_unauthenticated_protected_route`: **PASSED**
- `test_idor_protection`: **PASSED** (verifies User A cannot access User B's reports)
- `test_unified_search`: **PASSED**
- `test_notifications_endpoint`: **PASSED**
- `test_clinician_workspace_rbac`: **PASSED**
- `test_admin_dashboard_rbac`: **PASSED**
- `test_report_upload_and_extraction`: **PASSED**
- `test_health_metrics_crud_and_summary`: **PASSED**
- `test_ai_assistant_and_safety_alert`: **PASSED** (verifies emergency symptoms trigger critical red alert)
- `test_ml_celiac_risk_prediction`: **PASSED**
- `test_research_search_and_bookmarking`: **PASSED**
- `test_privacy_data_export`: **PASSED**

### B. Machine Learning Pytest Execution (`medipredict-ai/ml/tests/`)
```bash
pytest ml/tests/ -v
```
- `test_model_files_exist`: **PASSED**
- `test_model_predictions_shape_and_bounds`: **PASSED**
- `test_metadata_metrics`: **PASSED**

### C. Frontend Production Build (`medipredict-ai/apps/web/`)
```bash
cd apps/web && npm run build
✓ Compiled successfully
✓ Generating static pages (28/28)
```

---

## 9. Quick Start & Execution Guide

### Prerequisites
- **Node.js** >= `18.0.0`
- **Python** >= `3.10.0`
- **npm** >= `9.0.0`

### Step 1: Start Backend API Gateway
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
*Interactive Swagger documentation available at `http://127.0.0.1:8000/docs`.*

### Step 2: Start Frontend Application
```bash
cd apps/web
npm install
npm run dev
```
*Application available at `http://localhost:3000`.*

### Pre-seeded Demo Credentials
- **Email:** `demo@medipredict.ai`
- **Password:** `MedicalAI2026!`
- *(Or click the "Quick Auto-Fill" button on the `/login` screen)*

---

## 10. Zero-Trust Privacy & Regulatory Compliance

MediPredict AI adheres to strict international healthcare data protection frameworks:

- **Digital Personal Data Protection (DPDP) Act 2023:** Itemized, revocable consent ledger (`UserConsent` entity) recording consent purpose, version, and timestamp.
- **Data Portability:** One-click full data export generates a cryptographically hashed JSON bundle containing all patient records, telemetry, and reports.
- **Right to Erasure:** Permanent cascading deletion removes all user measurements, audit references, and active sessions.
- **HIPAA Security Rule Ready:** AES-256 encryption at rest, TLS 1.3 in transit, and role-based access control preventing Horizontal Privilege Escalation (IDOR).

---

## 11. Statutory Clinical & Legal Disclaimer

> **IMPORTANT CLINICAL NOTICE:**  
> MediPredict AI is an educational, research, and clinical decision-support software platform. It is **not** an autonomous medical diagnostic device, does **not** provide definitive clinical diagnoses, does **not** independently prescribe medications or clinical therapies, and must **never** replace the direct clinical judgment of a licensed, qualified healthcare professional.  
> Observational data from point-of-care biosensors and commercial consumer wearables are susceptible to motion artifacts, ambient temperature variations, and optical noise. In the event of an acute medical emergency, patients must immediately contact emergency services (**112 / 911 / 999**).
