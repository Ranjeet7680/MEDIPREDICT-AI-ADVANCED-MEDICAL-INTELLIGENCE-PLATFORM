# MediPredict AI — Privacy, DPDP Act 2023 & HIPAA Compliance Framework

## 1. Compliance Alignment
MediPredict AI is designed around the core principles of India's **Digital Personal Data Protection (DPDP) Act 2023**, the European Union's **General Data Protection Regulation (GDPR)**, and the **HIPAA Security Rule** guidelines for electronic protected health information (ePHI).

### Notice & Explicit Consent (DPDP Sec. 6)
- Users are presented with itemized consent items:
  1. `ai_data_analysis`: Consent to process laboratory measurements via the configured AI provider.
  2. `health_records_storage`: Consent to persist personal health measurements and uploaded report files.
  3. `anonymized_research`: Consent to contribute de-identified numerical ranges to epidemiological research cohorts.
- Consent preferences can be audited and revoked at any time under `/settings/privacy`.

### Right to Data Portability (DPDP Sec. 12 / GDPR Art. 20)
- Users can download their complete personal health history in one click (`POST /api/v1/privacy/export`).
- Output is a structured, machine-readable JSON archive containing profile data, laboratory reports, numerical test results, health vitals, and conversation logs.

### Right to Erasure & Account Purging (DPDP Sec. 12)
- Upon invoking account deletion (`POST /api/v1/privacy/account-deletion`), all relational child tables (`medical_reports`, `laboratory_measurements`, `health_measurements`, `conversations`, `messages`, `personal_records`) are cascaded and deleted permanently.
- An immutable audit trail entry is preserved verifying the purge request timestamp without retaining identifiable clinical data.

### Healthcare De-identification Standard
- No medical reports or personal identifiers are sent to external AI providers unless the user has granted explicit consent.
- When live AI providers are called, prompts are stripped of patient address, government ID numbers, and direct identifiers.
