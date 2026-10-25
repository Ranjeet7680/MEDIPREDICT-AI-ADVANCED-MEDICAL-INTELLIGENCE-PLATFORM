# MediPredict AI — REST API Reference (`/api/v1`)

## Authentication & Session Management
- `POST /api/v1/auth/register`: Create user account.
- `POST /api/v1/auth/login`: Authenticate email & password; returns JWT access & refresh tokens.
- `POST /api/v1/auth/refresh`: Issue new access token from valid refresh token.
- `POST /api/v1/auth/logout`: Invalidate active session.
- `POST /api/v1/auth/forgot-password`: Request reset token.
- `POST /api/v1/auth/reset-password`: Set new password with valid reset token.

## User Profile
- `GET /api/v1/users/me`: Return authenticated profile.
- `PATCH /api/v1/users/me`: Update full name or password.
- `DELETE /api/v1/users/me`: Delete user account and cascade associated records.

## Medical AI Assistant
- `GET /api/v1/assistant/providers`: Query configuration status of Gemini, OpenAI, Local, and Evidence Engine.
- `GET /api/v1/assistant/conversations`: List user consultations.
- `POST /api/v1/assistant/conversations`: Start new consultation.
- `GET /api/v1/assistant/conversations/{id}`: Retrieve message history.
- `DELETE /api/v1/assistant/conversations/{id}`: Delete consultation.
- `POST /api/v1/assistant/conversations/{id}/messages`: Submit query, run RAG evidence retrieval, and get grounded answer.

## Laboratory Reports
- `GET /api/v1/reports`: List user's laboratory reports with abnormal flag counts.
- `POST /api/v1/reports/upload`: Multipart upload of PDF/CSV/text report.
- `GET /api/v1/reports/{id}`: Retrieve full report with extracted measurements.
- `POST /api/v1/reports/{id}/analyze`: Run AI clinical interpretation on measurements.
- `PATCH /api/v1/reports/{id}/measurements/{measurement_id}`: Correct or verify extracted measurement.
- `DELETE /api/v1/reports/{id}`: Delete report.
- `GET /api/v1/reports/{id}/export`: Download clinical text export summary.

## Health Metrics & Trends
- `GET /api/v1/metrics`: List measurements with optional `metric_type` filter.
- `POST /api/v1/metrics`: Log new measurement.
- `GET /api/v1/metrics/summary`: Aggregate statistics (latest, average, min, max, clinical status).
- `PATCH /api/v1/metrics/{id}`: Update reading.
- `DELETE /api/v1/metrics/{id}`: Remove reading.
- `GET /api/v1/metrics/export/csv`: Stream complete CSV export.

## Medical Research, Diseases & Genetics
- `GET /api/v1/diseases`: List conditions with search and specialty filters.
- `GET /api/v1/diseases/{id}`: Get condition details.
- `GET /api/v1/genes`: List gene markers (HFE, BMP2, FTH1, MTHFR, BRCA1).
- `GET /api/v1/genes/{id}`: Get gene mechanism and inheritance data.
- `GET /api/v1/research/search`: Search PubMed metadata and clinical guidelines.
- `GET /api/v1/research/bookmarks`: List user bookmarks.
- `POST /api/v1/research/bookmarks`: Save article to bookmarks.
- `DELETE /api/v1/research/bookmarks/{id}`: Remove bookmark.

## Personal Health Records (PHR)
- `GET /api/v1/records`: List health records (immunizations, radiology, consultations).
- `POST /api/v1/records`: Create new record entry.
- `DELETE /api/v1/records/{id}`: Remove record.

## Privacy, DPDP & GDPR Governance
- `GET /api/v1/privacy/consent`: Fetch active consent records.
- `PATCH /api/v1/privacy/consent`: Update consent toggle (AI analysis, storage, research).
- `POST /api/v1/privacy/export`: Generate complete GDPR/DPDP personal data JSON export.
- `POST /api/v1/privacy/account-deletion`: Confirm and purge all user records.

## Machine Learning
- `POST /api/v1/ml/predict-risk`: Run tabular Celiac disease risk stratification.
- `GET /api/v1/ml/models/celiac`: Return model metadata, AUROC metrics, and model card.
