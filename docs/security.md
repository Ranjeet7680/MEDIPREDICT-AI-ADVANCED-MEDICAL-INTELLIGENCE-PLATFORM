# MediPredict AI — Security Architecture & Threat Modeling

## 1. Authentication & Cryptography
- **Password Hashing:** Passlib with Bcrypt (cost factor 12) preventing rainbow table attacks. Truncation guards enforce maximum 72-byte entropy limits.
- **Session Tokens:** Stateless JSON Web Tokens (JWT) signed with HS256. Short-lived access tokens (24 hours) paired with rotatable refresh tokens (7 days).
- **Session Revocation:** On logout, all active session IDs in `user_sessions` are flagged inactive, invalidating refresh requests.

## 2. Insecure Direct Object Reference (IDOR) Mitigation
- All endpoints (`/reports/{id}`, `/metrics/{id}`, `/records/{id}`, `/conversations/{id}`) strictly enforce database-level tenant verification.
- Queries verify `resource.user_id == current_user.id`. If a user attempts to access another patient's report, a `403 Forbidden` exception is raised immediately.
- Validated via automated test: `test_idor_protection`.

## 3. Input Sanitization & File Upload Security
- **File Upload Guard:** File uploads are limited to 15MB.
- **Allowed MIME types:** Validated against `application/pdf`, `text/csv`, `text/plain`, `image/png`, `image/jpeg`.
- **Private Storage:** Uploaded files are saved to private server directories using randomized timestamps and user ID prefixes. Public direct execution of uploaded scripts is disabled.
- **Prompt Injection Defense:** Input prompts are inspected for jailbreak patterns (`ignore previous instructions`, `you are now DAN`) and sanitized prior to language model dispatch.

## 4. Audit Logging
- High-consequence events (`LOGIN`, `LOGOUT`, `REPORT_UPLOAD`, `AI_QUERY`, `EXPORT_DATA`, `DELETE_RECORD`) write structured audit records to the `audit_events` table with timestamp, user ID, resource type, and IP address.
