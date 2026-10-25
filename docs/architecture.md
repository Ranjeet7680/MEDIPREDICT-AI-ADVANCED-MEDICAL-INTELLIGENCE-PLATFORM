# MediPredict AI — System Architecture & Design Specification

## 1. High-Level Architecture Overview
MediPredict AI is built as an enterprise full-stack clinical intelligence and healthcare research platform. The system combines modern reactive frontend presentation with a resilient asynchronous Python backend, machine learning research pipelines, and an evidence-grounded medical RAG subsystem.

```
                           +---------------------------+
                           |  Next.js 14 Web Frontend   |
                           |  (App Router, TypeScript)  |
                           +-------------+-------------+
                                         |
                                         | REST API (HTTP/JSON)
                                         v
                           +---------------------------+
                           |     FastAPI Backend       |
                           | (v1 Endpoints, Auth, RAG) |
                           +----+--------+--------+----+
                                |        |        |
        +-----------------------+        |        +---------------------+
        v                                v                              v
+---------------+             +--------------------+            +---------------+
| SQLAlchemy ORM|             | AI Provider Engine |            | Scikit-Learn  |
| PostgreSQL /  |             | Gemini / OpenAI /  |            | Tabular ML    |
| SQLite Local  |             | Clinical Evidence  |            | Risk Service  |
+---------------+             +--------------------+            +---------------+
```

## 2. Component Breakdown

### A. Frontend Layer (`apps/web/`)
- **Framework:** Next.js 14 with React 18, TypeScript strict mode.
- **Design System:** Clinical Calm token palette (Deep medical navy `#00635e`, Clinical teal `#167d78`, Soft cyan `#9af2eb`, Surface `#f4faff`).
- **Visualizations:** Recharts time-series dual-axis plotting for vitals and lab panels.
- **State Management & Auth:** Client-side token authentication with automatic route guards and central API client (`lib/api.ts`).

### B. Backend Services Layer (`backend/app/`)
- **FastAPI Core:** Centralized dependency injection (`get_db`, `get_current_user`), unified error handlers for IDOR/validation/safety exceptions.
- **Database Engine:** SQLAlchemy 2.0 with Alembic versioning. Supports PostgreSQL with pgvector in production and SQLite with WAL mode for local developer environments.
- **AI Provider Abstraction:** Factory pattern supporting Google Gemini (official Gen AI API), OpenAI, Local endpoints, and the deterministic MediPredict Evidence Engine.
- **Document Processing Pipeline:** Multi-format parser (PDF, CSV, clinical text) extracting numerical biomarker values, units, reference intervals, abnormal flags, and verification statuses.

### C. ML Research Module (`ml/`)
- **Model:** `GradientBoostingClassifier` trained on 2,206 patient serology records.
- **Task:** Celiac disease risk stratification before invasive endoscopic duodenal biopsy.
- **Evaluation:** Holdout test ROC-AUC: 0.9424, Accuracy: 95.25%, Brier Calibration Score: 0.0407.
