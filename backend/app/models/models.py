import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Enum,
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient")  # patient, clinician, researcher, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("UserConsent", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("MedicalReport", back_populates="user", cascade="all, delete-orphan", foreign_keys="[MedicalReport.user_id]")
    health_measurements = relationship("HealthMeasurement", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("ResearchBookmark", back_populates="user", cascade="all, delete-orphan")
    personal_records = relationship("PersonalRecord", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    sensor_measurements = relationship("SensorMeasurement", back_populates="user", cascade="all, delete-orphan")
    wearable_measurements = relationship("WearableMeasurement", back_populates="user", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")

class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(String(100), nullable=False)  # ai_data_analysis, health_records_storage, anonymized_research
    granted = Column(Boolean, default=False)
    version = Column(String(20), default="1.0")
    ip_address = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="consents")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="New Medical Consultation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # List of citations/references
    safety_alerts = Column(JSON, nullable=True)  # Warning or emergency flags
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), default="Laboratory Blood Panel")
    report_date = Column(DateTime, default=datetime.datetime.utcnow)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    status = Column(String(50), default="processed")  # pending, processing, processed, verified, failed
    summary = Column(Text, nullable=True)
    ai_interpretation = Column(Text, nullable=True)
    clinician_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    clinician_notes = Column(Text, nullable=True)
    clinician_status = Column(String(50), default="pending")  # pending, reviewed, approved, escalated
    clinician_reviewed_at = Column(DateTime, nullable=True)
    extraction_confidence = Column(Float, default=0.95)
    requires_verification = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports", foreign_keys=[user_id])
    clinician = relationship("User", foreign_keys=[clinician_id])
    measurements = relationship("LaboratoryMeasurement", back_populates="report", cascade="all, delete-orphan")

class LaboratoryMeasurement(Base):
    __tablename__ = "laboratory_measurements"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), default="General Biochemistry")
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reference_low = Column(Float, nullable=True)
    reference_high = Column(Float, nullable=True)
    reference_text = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, default=False)
    flag = Column(String(20), default="normal")  # normal, low, high, critical
    user_verified = Column(Boolean, default=False)
    confidence = Column(Float, default=0.95)
    notes = Column(Text, nullable=True)

    report = relationship("MedicalReport", back_populates="measurements")

class HealthMeasurement(Base):
    __tablename__ = "health_measurements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(100), nullable=False, index=True)  # blood_pressure, blood_glucose, heart_rate, hba1c, bmi, weight
    value = Column(Float, nullable=False)
    secondary_value = Column(Float, nullable=True)  # e.g., diastolic for BP
    unit = Column(String(50), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source = Column(String(100), default="Manual Entry")  # Manual Entry, Lab Report, Wearable Sync
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="health_measurements")

class MedicalReference(Base):
    __tablename__ = "medical_references"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=True)
    journal = Column(String(255), nullable=True)
    publication_year = Column(Integer, nullable=True)
    doi = Column(String(100), nullable=True)
    pmid = Column(String(50), nullable=True, index=True)
    abstract = Column(Text, nullable=True)
    key_findings = Column(Text, nullable=True)
    category = Column(String(100), default="Clinical Practice")
    evidence_level = Column(String(50), default="Systematic Review / RCT")
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookmarks = relationship("ResearchBookmark", back_populates="reference", cascade="all, delete-orphan")

class ResearchBookmark(Base):
    __tablename__ = "research_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reference_id = Column(Integer, ForeignKey("medical_references.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")
    reference = relationship("MedicalReference", back_populates="bookmarks")

class DiseaseCondition(Base):
    __tablename__ = "disease_conditions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    specialty = Column(String(100), nullable=False, index=True)  # Gastroenterology, Hematology, Oncology, Endocrinology
    summary = Column(Text, nullable=False)
    symptoms = Column(JSON, nullable=True)  # List of symptoms
    risk_factors = Column(JSON, nullable=True)  # List of risk factors
    diagnostic_tests = Column(JSON, nullable=True)  # Relevant lab tests & imaging
    clinical_guidelines = Column(Text, nullable=True)
    last_reviewed = Column(DateTime, default=datetime.datetime.utcnow)
    pmid_references = Column(JSON, nullable=True)

class GeneAssociation(Base):
    __tablename__ = "gene_associations"

    id = Column(Integer, primary_key=True, index=True)
    gene_symbol = Column(String(50), index=True, nullable=False)
    gene_name = Column(String(255), nullable=False)
    chromosome = Column(String(20), nullable=True)
    inheritance_pattern = Column(String(100), nullable=True)  # Autosomal Recessive, Autosomal Dominant, X-Linked
    associated_condition = Column(String(255), nullable=False)
    doid = Column(String(50), nullable=True)
    omim_id = Column(String(50), nullable=True)
    pmid = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    clinical_uncertainty_note = Column(Text, nullable=True)

class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Immunization Record")  # Clinical Consultation, Radiology, Pathology, Prescription
    record_date = Column(DateTime, default=datetime.datetime.utcnow)
    doctor_or_facility = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="personal_records")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, VIEW_REPORT, EXPORT_DATA, DELETE_RECORD, AI_QUERY
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_events")

class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(String(100), primary_key=True)
    job_type = Column(String(100), nullable=False)  # OCR_DOCUMENT, REPORT_ANALYZE, DATASET_EXPORT
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    progress = Column(Integer, default=0)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, critical, report_ready
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String(100), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(100), nullable=False, index=True)  # wearable, medical_sensor, iot_gateway, edge_device
    model_number = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    mac_address = Column(String(100), nullable=True)
    connection_protocol = Column(String(50), default="https")  # ble, mqtt, https, websocket
    connection_status = Column(String(50), default="disconnected")  # connected, disconnected, pairing, error
    last_seen = Column(DateTime, nullable=True)
    firmware_version = Column(String(50), nullable=True)
    battery_level = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    device_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="devices")
    sensor_measurements = relationship("SensorMeasurement", back_populates="device", cascade="all, delete-orphan")
    wearable_measurements = relationship("WearableMeasurement", back_populates="device", cascade="all, delete-orphan")
    connections = relationship("DeviceConnection", back_populates="device", cascade="all, delete-orphan")
    credentials = relationship("DeviceCredential", back_populates="device", cascade="all, delete-orphan")

class DeviceCredential(Base):
    __tablename__ = "device_credentials"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    credential_type = Column(String(50), default="api_key")  # api_key, mqtt_token, psk
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    device = relationship("Device", back_populates="credentials")

class DeviceConnection(Base):
    __tablename__ = "device_connections"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    connected_at = Column(DateTime, default=datetime.datetime.utcnow)
    disconnected_at = Column(DateTime, nullable=True)
    ip_address = Column(String(100), nullable=True)
    protocol = Column(String(50), default="https")

    device = relationship("Device", back_populates="connections")

class SensorMeasurement(Base):
    __tablename__ = "sensor_measurements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(100), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True)
    measurement_type = Column(String(100), nullable=False, index=True)  # heart_rate, spo2, temperature, blood_pressure, glucose, respiratory_rate
    value = Column(Float, nullable=False)
    secondary_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source = Column(String(100), default="medical_sensor")
    quality_status = Column(String(50), default="unverified")  # unverified, calibrated, flagged, verified
    raw_payload = Column(JSON, nullable=True)
    payload_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="sensor_measurements")
    device = relationship("Device", back_populates="sensor_measurements")

class WearableMeasurement(Base):
    __tablename__ = "wearable_measurements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(100), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True)
    platform = Column(String(100), nullable=False, index=True)  # apple_health, health_connect, fitbit, garmin, wear_os
    metric_type = Column(String(100), nullable=False, index=True)  # steps, active_energy, sleep_duration, resting_heart_rate, vo2_max
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    synced_at = Column(DateTime, default=datetime.datetime.utcnow)
    source_record_id = Column(String(255), nullable=True, index=True)

    user = relationship("User", back_populates="wearable_measurements")
    device = relationship("Device", back_populates="wearable_measurements")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(100), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_type = Column(String(100), nullable=False, index=True)  # medical_information, medical_report, health_monitoring, research, device_integration, healthcare_workflow, supervisor
    task_description = Column(Text, nullable=False)
    status = Column(String(50), default="completed")  # pending, running, completed, escalated, failed
    result = Column(JSON, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    human_review_required = Column(Boolean, default=False)
    human_review_notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="agent_runs")

class MLExperiment(Base):
    __tablename__ = "ml_experiments"

    id = Column(String(100), primary_key=True, index=True)
    model_name = Column(String(100), nullable=False, index=True)
    experiment_name = Column(String(255), nullable=False)
    dataset_name = Column(String(255), nullable=False)
    parameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=False)  # accuracy, roc_auc, precision, recall, brier_score
    artifact_path = Column(String(500), nullable=True)
    version = Column(String(50), default="1.0.0")
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

