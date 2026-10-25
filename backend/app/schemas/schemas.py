import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "patient"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# --- AI Assistant & Conversations ---
class MessageSource(BaseModel):
    title: str
    journal_or_org: Optional[str] = None
    year: Optional[int] = None
    pmid: Optional[str] = None
    url: Optional[str] = None
    evidence_level: Optional[str] = "Clinical Evidence"

class MessageCreate(BaseModel):
    content: str
    provider: Optional[str] = None  # gemini, openai, local, clinical_evidence
    report_attachment_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    safety_alerts: Optional[List[str]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Medical Consultation"

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

class ProviderStatusResponse(BaseModel):
    current_provider: str
    providers: Dict[str, Dict[str, Any]]

# --- Laboratory Reports & Measurements ---
class LaboratoryMeasurementBase(BaseModel):
    test_name: str
    category: Optional[str] = "General Biochemistry"
    value: float
    unit: str
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    reference_text: Optional[str] = None
    is_abnormal: Optional[bool] = False
    flag: Optional[str] = "normal"
    confidence: Optional[float] = 0.95
    user_verified: Optional[bool] = False
    notes: Optional[str] = None

class LaboratoryMeasurementUpdate(BaseModel):
    test_name: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    reference_text: Optional[str] = None
    user_verified: Optional[bool] = True
    flag: Optional[str] = None

class LaboratoryMeasurementResponse(LaboratoryMeasurementBase):
    id: int
    report_id: int

    model_config = ConfigDict(from_attributes=True)

class MedicalReportCreate(BaseModel):
    title: str
    report_type: Optional[str] = "Comprehensive Blood Analysis"
    report_date: Optional[datetime.datetime] = None
    summary: Optional[str] = None

class MedicalReportResponse(BaseModel):
    id: int
    user_id: int
    title: str
    report_type: str
    report_date: datetime.datetime
    status: str
    file_name: Optional[str] = None
    summary: Optional[str] = None
    ai_interpretation: Optional[str] = None
    extraction_confidence: float
    requires_verification: bool
    created_at: datetime.datetime
    measurement_count: Optional[int] = 0
    abnormal_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class MedicalReportDetailResponse(MedicalReportResponse):
    measurements: List[LaboratoryMeasurementResponse] = []

class ReportAnalysisResponse(BaseModel):
    report_id: int
    summary: str
    ai_interpretation: str
    key_findings: List[str]
    potential_abnormalities: List[str]
    clinical_disclaimer: str

# --- Health Measurements (Trends) ---
class HealthMeasurementCreate(BaseModel):
    metric_type: str  # blood_pressure, blood_glucose, heart_rate, hba1c, bmi, weight
    value: float
    secondary_value: Optional[float] = None
    unit: str
    recorded_at: Optional[datetime.datetime] = None
    source: Optional[str] = "Manual Entry"
    notes: Optional[str] = None

class HealthMeasurementUpdate(BaseModel):
    value: Optional[float] = None
    secondary_value: Optional[float] = None
    unit: Optional[str] = None
    recorded_at: Optional[datetime.datetime] = None
    notes: Optional[str] = None

class HealthMeasurementResponse(HealthMeasurementCreate):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class HealthMetricSummary(BaseModel):
    metric_type: str
    unit: str
    latest_value: float
    latest_secondary: Optional[float] = None
    latest_date: datetime.datetime
    min_value: float
    max_value: float
    average: float
    status: str  # normal, elevated, low, critical

# --- Research, Diseases & Genetics ---
class DiseaseConditionResponse(BaseModel):
    id: int
    name: str
    specialty: str
    summary: str
    symptoms: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None
    diagnostic_tests: Optional[List[str]] = None
    clinical_guidelines: Optional[str] = None
    last_reviewed: datetime.datetime
    pmid_references: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class GeneAssociationResponse(BaseModel):
    id: int
    gene_symbol: str
    gene_name: str
    chromosome: Optional[str] = None
    inheritance_pattern: Optional[str] = None
    associated_condition: str
    doid: Optional[str] = None
    omim_id: Optional[str] = None
    pmid: Optional[str] = None
    description: str
    clinical_uncertainty_note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MedicalReferenceResponse(BaseModel):
    id: int
    title: str
    authors: Optional[str] = None
    journal: Optional[str] = None
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    pmid: Optional[str] = None
    abstract: Optional[str] = None
    key_findings: Optional[str] = None
    category: str
    evidence_level: str
    url: Optional[str] = None
    is_bookmarked: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class BookmarkCreate(BaseModel):
    reference_id: int
    notes: Optional[str] = None

class BookmarkResponse(BaseModel):
    id: int
    user_id: int
    reference_id: int
    notes: Optional[str] = None
    created_at: datetime.datetime
    reference: Optional[MedicalReferenceResponse] = None

    model_config = ConfigDict(from_attributes=True)

# --- Personal Health Records ---
class PersonalRecordCreate(BaseModel):
    title: str
    category: Optional[str] = "Clinical Consultation"
    record_date: Optional[datetime.datetime] = None
    doctor_or_facility: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None

class PersonalRecordResponse(PersonalRecordCreate):
    id: int
    user_id: int
    file_name: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Privacy & Consents ---
class ConsentUpdate(BaseModel):
    consent_type: str
    granted: bool

class ConsentResponse(BaseModel):
    id: int
    consent_type: str
    granted: bool
    version: str
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class PrivacyExportResponse(BaseModel):
    user_profile: Dict[str, Any]
    reports: List[Dict[str, Any]]
    health_measurements: List[Dict[str, Any]]
    personal_records: List[Dict[str, Any]]
    conversations: List[Dict[str, Any]]
    consents: List[Dict[str, Any]]
    exported_at: datetime.datetime

# --- ML Risk Prediction ---
class CeliacRiskRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., description="Male or Female")
    diabetes: str = Field("No", description="Yes or No")
    diabetes_type: Optional[str] = Field("None", description="Type 1, Type 2, or None")
    diarrhoea: str = Field("no", description="inflammatory, fatty, watery, or no")
    abdominal_pain: str = Field("no", description="yes or no")
    short_stature: str = Field("no", description="PSS, Variant, or no")
    sticky_stool: str = Field("no", description="yes or no")
    weight_loss: str = Field("no", description="yes or no")
    iga: float = Field(..., description="Serum IgA in g/L")
    igg: float = Field(..., description="Serum IgG in g/L")
    igm: float = Field(..., description="Serum IgM in g/L")

class CeliacRiskResponse(BaseModel):
    estimated_risk_probability: float
    risk_level: str  # Low, Moderate, Elevated, High
    predicted_classification: str
    confidence_interval: List[float]
    model_provenance: Dict[str, Any]
    contributing_factors: List[str]
    recommended_clinical_followup: List[str]
    disclaimer: str

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Clinician Workspace Schemas ---
class ClinicianReviewRequest(BaseModel):
    clinician_notes: str
    status: str = "approved"  # reviewed, approved, escalated

class ClinicianReportResponse(MedicalReportDetailResponse):
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    clinician_notes: Optional[str] = None
    clinician_status: Optional[str] = "pending"
    clinician_reviewed_at: Optional[datetime.datetime] = None

# --- Unified Search Schemas ---
class UnifiedSearchResult(BaseModel):
    category: str
    id: int
    title: str
    subtitle: Optional[str] = None
    link: str

# --- Admin Stats Schemas ---
class AdminStatsResponse(BaseModel):
    total_users: int
    total_reports: int
    total_measurements: int
    total_conversations: int
    total_audit_events: int
    database_status: str
    ai_provider: str

# --- Device & IoT Schemas ---
class DeviceBase(BaseModel):
    device_name: str
    device_type: str  # wearable, medical_sensor, iot_gateway, edge_device
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    mac_address: Optional[str] = None
    connection_protocol: Optional[str] = "https"
    device_metadata: Optional[Dict[str, Any]] = None

class DeviceCreate(DeviceBase):
    id: Optional[str] = None

class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    connection_status: Optional[str] = None
    battery_level: Optional[int] = None
    firmware_version: Optional[str] = None
    device_metadata: Optional[Dict[str, Any]] = None

class DeviceResponse(DeviceBase):
    id: str
    user_id: int
    connection_status: str
    last_seen: Optional[datetime.datetime] = None
    firmware_version: Optional[str] = None
    battery_level: Optional[int] = None
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class DeviceStatusResponse(BaseModel):
    device_id: str
    connection_status: str
    last_seen: Optional[datetime.datetime] = None
    battery_level: Optional[int] = None
    uptime_seconds: Optional[int] = None
    active_stream: bool = False

# --- Unified Device Ingestion (Section 10 Standard) ---
class UnifiedSensorPayload(BaseModel):
    device_id: str
    user_id: Optional[Union[str, int]] = None
    measurement_type: str
    value: float
    secondary_value: Optional[float] = None
    unit: str
    timestamp: Optional[datetime.datetime] = None
    source: Optional[str] = "compatible_wearable"
    quality_status: Optional[str] = "unverified"
    metadata: Optional[Dict[str, Any]] = None

class UnifiedSensorBatchPayload(BaseModel):
    device_id: str
    measurements: List[UnifiedSensorPayload]

class SensorMeasurementResponse(BaseModel):
    id: int
    user_id: int
    device_id: Optional[str] = None
    measurement_type: str
    value: float
    secondary_value: Optional[float] = None
    unit: str
    timestamp: datetime.datetime
    source: str
    quality_status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class WearableMeasurementItem(BaseModel):
    metric_type: str
    value: float
    unit: str
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    source_record_id: Optional[str] = None

class WearableIngestionPayload(BaseModel):
    platform: str  # apple_health, health_connect, fitbit, garmin, wear_os
    device_id: Optional[str] = None
    records: List[WearableMeasurementItem]

class WearableMeasurementResponse(BaseModel):
    id: int
    user_id: int
    device_id: Optional[str] = None
    platform: str
    metric_type: str
    value: float
    unit: str
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    synced_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class IngestionResult(BaseModel):
    status: str
    ingested_count: int
    rejected_count: int
    duplicate_count: int
    quality_status: str
    message: str

# --- Analytics Schemas ---
class AnalyticsOverviewResponse(BaseModel):
    total_measurements: int
    active_devices_count: int
    average_heart_rate: Optional[float] = None
    latest_blood_pressure: Optional[str] = None
    latest_spo2: Optional[float] = None
    data_quality_score: float
    recent_anomalies_count: int
    timestamp: datetime.datetime

class DeviceHealthItem(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    status: str
    battery_level: Optional[int]
    last_seen: Optional[datetime.datetime]
    data_points_24h: int
    error_rate: float

class DataQualityReport(BaseModel):
    overall_quality_percentage: float
    verified_points: int
    calibrated_points: int
    unverified_points: int
    flagged_outliers: int
    recommendations: List[str]

# --- Multi-Agent Schemas ---
class AgentRunRequest(BaseModel):
    agent_type: str = "supervisor"  # supervisor, medical_information, medical_report, health_monitoring, research, device_integration, healthcare_workflow
    task_description: str
    context: Optional[Dict[str, Any]] = None

class AgentRunResponse(BaseModel):
    id: str
    user_id: int
    agent_type: str
    task_description: str
    status: str
    result: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    human_review_required: bool = False
    human_review_notes: Optional[str] = None
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- ML Experiment Schemas ---
class MLExperimentCreate(BaseModel):
    model_name: str
    experiment_name: str
    dataset_name: str
    parameters: Optional[Dict[str, Any]] = None
    metrics: Dict[str, float]
    artifact_path: Optional[str] = None
    version: Optional[str] = "1.0.0"

class MLExperimentResponse(BaseModel):
    id: str
    model_name: str
    experiment_name: str
    dataset_name: str
    parameters: Optional[Dict[str, Any]] = None
    metrics: Dict[str, Any]
    artifact_path: Optional[str] = None
    version: str
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

