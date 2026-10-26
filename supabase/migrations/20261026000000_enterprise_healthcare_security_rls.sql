-- ==============================================================================
-- MEDIPREDICT AI — ENTERPRISE HEALTHCARE POSTGRESQL & ROW-LEVEL SECURITY (RLS)
-- Migration: 20261026000000_enterprise_healthcare_security_rls.sql
-- Framework: Supabase PostgreSQL 17 / PostgreSQL 15+
-- Standards: DPDP Act 2023, HIPAA Security Rule, GDPR Article 9 & 20
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMAS & SECURE SEARCH PATH
SET search_path = public, extensions;

-- ==============================================================================
-- 3. CORE IDENTITY & ROLE-BASED TABLES
-- ==============================================================================

-- Users & Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'clinician', 'researcher', 'admin')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Clinician Profiles (Credentials, Medical Registration, Specialty)
CREATE TABLE IF NOT EXISTS public.clinician_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    medical_council VARCHAR(100) NOT NULL, -- e.g. National Medical Commission (NMC India), GMC, State Board
    specialty VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Patient Profiles (Demographics, Emergency Contacts)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    biological_sex VARCHAR(20) CHECK (biological_sex IN ('female', 'male', 'intersex', 'other')),
    blood_group VARCHAR(10),
    emergency_contact_phone VARCHAR(50),
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Clinician-Patient Relationships (ReBAC care relationship authorization)
CREATE TABLE IF NOT EXISTS public.clinician_patient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL DEFAULT 'direct_care' CHECK (relationship_type IN ('direct_care', 'specialist_referral', 'triage_evaluation', 'emergency_override')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'pending', 'expired')),
    authorized_until TIMESTAMPTZ,
    clinical_rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_clinician_patient_pair UNIQUE(clinician_id, patient_id)
);

-- ==============================================================================
-- 4. CLINICAL DATA TABLES (REPORTS, BIOMARKERS, PHR, METRICS)
-- ==============================================================================

-- Medical Reports Table
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL DEFAULT 'Laboratory Blood Panel',
    report_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    storage_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processing', 'processed', 'verified', 'failed')),
    summary TEXT,
    ai_interpretation TEXT,
    clinician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    clinician_notes TEXT,
    clinician_status VARCHAR(50) DEFAULT 'pending' CHECK (clinician_status IN ('pending', 'reviewed', 'approved', 'escalated')),
    clinician_reviewed_at TIMESTAMPTZ,
    extraction_confidence NUMERIC(4,3) NOT NULL DEFAULT 0.950 CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0),
    requires_verification BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Extracted Biomarkers / Laboratory Measurements
CREATE TABLE IF NOT EXISTS public.extracted_biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General Biochemistry',
    value NUMERIC(12,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_low NUMERIC(12,4),
    reference_high NUMERIC(12,4),
    reference_text VARCHAR(100),
    is_abnormal BOOLEAN NOT NULL DEFAULT false,
    flag VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (flag IN ('normal', 'low', 'high', 'critical')),
    user_verified BOOLEAN NOT NULL DEFAULT false,
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.950,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Health Metrics (Time-Series Vital Signs)
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- blood_pressure, blood_glucose, heart_rate, hba1c, bmi, weight
    value NUMERIC(12,4) NOT NULL,
    secondary_value NUMERIC(12,4),
    unit VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source VARCHAR(100) NOT NULL DEFAULT 'Manual Entry',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Personal Health Records (Immunizations, Pathology, Consultations)
CREATE TABLE IF NOT EXISTS public.personal_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Clinical Consultation',
    record_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    doctor_or_facility VARCHAR(255),
    storage_path VARCHAR(500),
    file_name VARCHAR(255),
    summary TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. CONNECTED HEALTH, SENSORS & WEARABLES
-- ==============================================================================

-- Connected Devices
CREATE TABLE IF NOT EXISTS public.wearable_devices (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- wearable, medical_sensor, iot_gateway
    connection_protocol VARCHAR(50) NOT NULL DEFAULT 'https',
    connection_status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    last_seen TIMESTAMPTZ,
    firmware_version VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Wearable Telemetry Measurements
CREATE TABLE IF NOT EXISTS public.wearable_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(100) REFERENCES public.wearable_devices(id) ON DELETE SET NULL,
    platform VARCHAR(100) NOT NULL, -- apple_health, health_connect, fitbit
    metric_type VARCHAR(100) NOT NULL,
    value NUMERIC(12,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Medical Sensor Streams
CREATE TABLE IF NOT EXISTS public.sensor_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(100) REFERENCES public.wearable_devices(id) ON DELETE SET NULL,
    measurement_type VARCHAR(100) NOT NULL,
    value NUMERIC(12,4) NOT NULL,
    secondary_value NUMERIC(12,4),
    unit VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    quality_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    payload_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. AI CONVERSATIONS & EVIDENCE BASE
-- ==============================================================================

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Medical Consultation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- AI Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    safety_alerts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Medical Research Library (Public Evidence Grounding)
CREATE TABLE IF NOT EXISTS public.medical_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(500),
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(100),
    pmid VARCHAR(50) UNIQUE,
    abstract TEXT,
    key_findings TEXT,
    category VARCHAR(100) DEFAULT 'Clinical Practice',
    evidence_level VARCHAR(50) DEFAULT 'CEBM Level 1a',
    url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Disease Conditions Explorer
CREATE TABLE IF NOT EXISTS public.disease_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    symptoms JSONB,
    risk_factors JSONB,
    diagnostic_tests JSONB,
    clinical_guidelines TEXT,
    pmid_references JSONB,
    last_reviewed TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Gene & Genetics Intelligence
CREATE TABLE IF NOT EXISTS public.genetic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gene_symbol VARCHAR(50) NOT NULL,
    gene_name VARCHAR(255) NOT NULL,
    chromosome VARCHAR(20),
    inheritance_pattern VARCHAR(100),
    associated_condition VARCHAR(255) NOT NULL,
    doid VARCHAR(50),
    omim_id VARCHAR(50),
    pmid VARCHAR(50),
    description TEXT NOT NULL,
    clinical_uncertainty_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. PRIVACY, CONSENT & AUDIT TRAILS (DPDP ACT 2023)
-- ==============================================================================

-- Consent Records (Purpose-Specific Consent Tracking)
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- ai_data_analysis, health_records_storage, anonymized_research
    granted BOOLEAN NOT NULL DEFAULT false,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    ip_address VARCHAR(100),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    withdrawn_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Data Export Requests (DPDP Act 2023 Section 11 / GDPR Article 20)
CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    export_format VARCHAR(50) NOT NULL DEFAULT 'json',
    download_token_hash VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Data Deletion Requests (DPDP Act 2023 Section 12 Right to Erasure)
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed', 'rejected')),
    verification_token VARCHAR(255),
    reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tamper-Evident Immutable Audit Log (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(100),
    outcome VARCHAR(50) NOT NULL DEFAULT 'success',
    checksum VARCHAR(64) NOT NULL, -- Cryptographic HMAC-SHA256 signature
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. SECURITY-DEFINER HELPER FUNCTIONS (FIXED SEARCH PATH)
-- ==============================================================================

-- Helper: Get Current User Profile UUID from auth.uid()
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Helper: Get Current User Role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT role FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Helper: Check Active Clinician-Patient Care Relationship
CREATE OR REPLACE FUNCTION public.has_active_care_relationship(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.clinician_patient_relationships cpr
        JOIN public.profiles clinician ON cpr.clinician_id = clinician.id
        WHERE clinician.auth_id = auth.uid()
          AND cpr.patient_id = p_patient_id
          AND cpr.status = 'active'
          AND (cpr.authorized_until IS NULL OR cpr.authorized_until >= timezone('utc'::text, now()))
    );
$$;

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) ACTIVATION
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.clinician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinician_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.clinician_patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinician_patient_relationships FORCE ROW LEVEL SECURITY;

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports FORCE ROW LEVEL SECURITY;

ALTER TABLE public.extracted_biomarkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_biomarkers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics FORCE ROW LEVEL SECURITY;

ALTER TABLE public.personal_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_health_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_devices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.wearable_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_measurements FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sensor_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_measurements FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.medical_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetic_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events FORCE ROW LEVEL SECURITY;

-- ==============================================================================
-- 10. ROW-LEVEL SECURITY POLICIES
-- ==============================================================================

-- --- PROFILES POLICIES ---
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE auth_id = auth.uid())); -- Prevents self-role tampering

-- --- CLINICIAN-PATIENT RELATIONSHIPS ---
CREATE POLICY "Clinicians and patients can view their mutual relationships"
ON public.clinician_patient_relationships FOR SELECT
TO authenticated
USING (
    clinician_id = public.current_profile_id() OR
    patient_id = public.current_profile_id() OR
    public.current_user_role() = 'admin'
);

-- --- MEDICAL REPORTS POLICIES ---
CREATE POLICY "Patients can view their own medical reports"
ON public.medical_reports FOR SELECT
TO authenticated
USING (
    patient_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(patient_id))
);

CREATE POLICY "Patients can upload their own reports"
ON public.medical_reports FOR INSERT
TO authenticated
WITH CHECK (patient_id = public.current_profile_id());

CREATE POLICY "Patients and assigned clinicians can update reports"
ON public.medical_reports FOR UPDATE
TO authenticated
USING (
    patient_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(patient_id))
);

CREATE POLICY "Only patient owners or admins can delete medical reports"
ON public.medical_reports FOR DELETE
TO authenticated
USING (patient_id = public.current_profile_id() OR public.current_user_role() = 'admin');

-- --- EXTRACTED BIOMARKERS POLICIES ---
CREATE POLICY "Biomarkers visible to authorized report readers"
ON public.extracted_biomarkers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.medical_reports r
        WHERE r.id = report_id
          AND (
            r.patient_id = public.current_profile_id() OR
            public.current_user_role() = 'admin' OR
            (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(r.patient_id))
          )
    )
);

CREATE POLICY "Report owners can insert or modify biomarkers"
ON public.extracted_biomarkers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.medical_reports r
        WHERE r.id = report_id
          AND (r.patient_id = public.current_profile_id() OR public.current_user_role() = 'admin')
    )
);

-- --- HEALTH METRICS POLICIES ---
CREATE POLICY "Patients and care clinicians can view health metrics"
ON public.health_metrics FOR SELECT
TO authenticated
USING (
    patient_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(patient_id))
);

CREATE POLICY "Patients can insert their own health metrics"
ON public.health_metrics FOR INSERT
TO authenticated
WITH CHECK (patient_id = public.current_profile_id());

-- --- PERSONAL HEALTH RECORDS POLICIES ---
CREATE POLICY "Patients can view their personal health records"
ON public.personal_health_records FOR SELECT
TO authenticated
USING (
    patient_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(patient_id))
);

CREATE POLICY "Patients can manage their own personal health records"
ON public.personal_health_records FOR ALL
TO authenticated
USING (patient_id = public.current_profile_id() OR public.current_user_role() = 'admin');

-- --- WEARABLE & SENSOR TELEMETRY ---
CREATE POLICY "Users can manage their own wearable devices"
ON public.wearable_devices FOR ALL
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Users and assigned clinicians can read wearable metrics"
ON public.wearable_measurements FOR SELECT
TO authenticated
USING (
    user_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(user_id))
);

CREATE POLICY "Users and assigned clinicians can read sensor streams"
ON public.sensor_measurements FOR SELECT
TO authenticated
USING (
    user_id = public.current_profile_id() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'clinician' AND public.has_active_care_relationship(user_id))
);

-- --- AI CONVERSATIONS & MESSAGES ---
CREATE POLICY "Users can manage their own AI consultations"
ON public.ai_conversations FOR ALL
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Users can access messages within their consultations"
ON public.ai_messages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = conversation_id
          AND (c.user_id = public.current_profile_id() OR public.current_user_role() = 'admin')
    )
);

-- --- PUBLIC MEDICAL RESEARCH & EVIDENCE (READ-ONLY FOR ALL) ---
CREATE POLICY "Public read-only medical research access"
ON public.medical_research FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Public read-only disease condition knowledge"
ON public.disease_conditions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Public read-only genetic records"
ON public.genetic_records FOR SELECT
TO authenticated, anon
USING (true);

-- --- PRIVACY, CONSENT & REQUESTS (DPDP ACT 2023) ---
CREATE POLICY "Users can view and manage their consent records"
ON public.consent_records FOR ALL
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Users can view their export requests"
ON public.data_export_requests FOR ALL
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Users can view their deletion requests"
ON public.data_deletion_requests FOR ALL
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

CREATE POLICY "Users can manage their notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = public.current_profile_id());

-- --- IMMUTABLE AUDIT LOGS (APPEND-ONLY) ---
CREATE POLICY "Authenticated actors can append audit records"
ON public.audit_events FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Admins and resource owners can view audit logs"
ON public.audit_events FOR SELECT
TO authenticated
USING (user_id = public.current_profile_id() OR public.current_user_role() = 'admin');

-- REVOKE UPDATE AND DELETE on audit_events to guarantee tamper-resistance
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_events FROM authenticated, anon, public;

-- ==============================================================================
-- 11. EXPLICIT LEAST-PRIVILEGE GRANTS
-- ==============================================================================

-- Revoke default public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public, anon;

-- Grant minimal permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.medical_research, public.disease_conditions, public.genetic_records TO anon;

-- Explicitly revoke audit modification
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_events FROM authenticated;

-- Service role bypass for automated migrations and system maintenance
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
