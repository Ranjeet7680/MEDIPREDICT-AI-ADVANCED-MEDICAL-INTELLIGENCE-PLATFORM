export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface MessageSource {
  title: string;
  journal?: string;
  year?: number;
  pmid?: string;
  doi?: string;
  evidence_level?: string;
  url?: string;
  abstract?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: MessageSource[];
  safety_alerts?: string[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  messages?: Message[];
}

export interface LaboratoryMeasurement {
  id: number;
  report_id: number;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  reference_low?: number;
  reference_high?: number;
  reference_text?: string;
  is_abnormal: boolean;
  flag: "normal" | "low" | "high" | "critical";
  user_verified: boolean;
  confidence: number;
  notes?: string;
}

export interface MedicalReport {
  id: number;
  user_id: number;
  title: string;
  report_type: string;
  report_date: string;
  status: string;
  file_name?: string;
  summary?: string;
  ai_interpretation?: string;
  extraction_confidence: number;
  requires_verification: boolean;
  created_at: string;
  measurement_count: number;
  abnormal_count: number;
  measurements?: LaboratoryMeasurement[];
}

export interface HealthMeasurement {
  id: number;
  user_id: number;
  metric_type: string;
  value: number;
  secondary_value?: number;
  unit: string;
  recorded_at: string;
  source: string;
  notes?: string;
}

export interface HealthMetricSummary {
  metric_type: string;
  unit: string;
  latest_value: number;
  latest_secondary?: number;
  latest_date: string;
  min_value: number;
  max_value: number;
  average: number;
  status: "normal" | "elevated" | "low" | "irregular";
}

export interface DiseaseCondition {
  id: number;
  name: string;
  specialty: string;
  summary: string;
  symptoms?: string[];
  risk_factors?: string[];
  diagnostic_tests?: string[];
  clinical_guidelines?: string;
  last_reviewed: string;
  pmid_references?: string[];
}

export interface GeneAssociation {
  id: number;
  gene_symbol: string;
  gene_name: string;
  chromosome?: string;
  inheritance_pattern?: string;
  associated_condition: string;
  doid?: string;
  omim_id?: string;
  pmid?: string;
  description: string;
  clinical_uncertainty_note?: string;
}

export interface MedicalReference {
  id: number;
  title: string;
  authors?: string;
  journal?: string;
  publication_year?: number;
  doi?: string;
  pmid?: string;
  abstract?: string;
  key_findings?: string;
  category: string;
  evidence_level: string;
  url?: string;
  is_bookmarked?: boolean;
}

export interface ResearchBookmark {
  id: number;
  user_id: number;
  reference_id: number;
  notes?: string;
  created_at: string;
  reference?: MedicalReference;
}

export interface PersonalRecord {
  id: number;
  user_id: number;
  title: string;
  category: string;
  record_date: string;
  doctor_or_facility?: string;
  summary?: string;
  tags?: string[];
  created_at: string;
}

export interface UserConsent {
  id: number;
  consent_type: string;
  granted: boolean;
  version: string;
  updated_at: string;
}

export interface CeliacRiskRequest {
  age: number;
  gender: string;
  diabetes: string;
  diabetes_type?: string;
  diarrhoea: string;
  abdominal_pain: string;
  short_stature: string;
  sticky_stool: string;
  weight_loss: string;
  iga: number;
  igg: number;
  igm: number;
}

export interface CeliacRiskResponse {
  estimated_risk_probability: number;
  risk_level: string;
  predicted_classification: string;
  confidence_interval: number[];
  model_provenance: {
    algorithm: string;
    version: string;
    sample_count: number;
    test_auc: number;
    test_accuracy: number;
  };
  contributing_factors: string[];
  recommended_clinical_followup: string[];
  disclaimer: string;
}

export interface ProviderStatus {
  current_provider: string;
  providers: Record<
    string,
    {
      name: string;
      configured: boolean;
      model: string;
      description: string;
    }
  >;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "report_ready";
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ClinicianReportItem extends MedicalReport {
  patient_name?: string;
  patient_email?: string;
  clinician_notes?: string;
  clinician_status?: "pending" | "reviewed" | "approved" | "escalated";
  clinician_reviewed_at?: string;
}

export interface AdminStatsItem {
  total_users: number;
  total_reports: number;
  total_measurements: number;
  total_conversations: number;
  total_audit_events: number;
  database_status: string;
  ai_provider: string;
}

export interface AuditLogItem {
  id: number;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
  user_email?: string;
  user_name?: string;
}

export interface SearchResultItem {
  category: "Disease" | "Genetics" | "Research" | "Health Record";
  id: number;
  title: string;
  subtitle?: string;
  link: string;
}

// Connected Healthcare & Ingestion Types
export interface Device {
  id: string;
  user_id: number;
  name: string;
  device_type: "wearable" | "sensor" | "iot_gateway" | "clinical_monitor" | "other";
  manufacturer?: string;
  model_number?: string;
  firmware_version?: string;
  serial_number?: string;
  protocol: "bluetooth_le" | "wifi" | "zigbee" | "cellular" | "cloud_api" | "mqtt" | "usb" | "manual";
  status: "active" | "inactive" | "pairing" | "error" | "maintenance";
  battery_level?: number;
  last_sync_at?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreate {
  name: string;
  device_type: "wearable" | "sensor" | "iot_gateway" | "clinical_monitor" | "other";
  manufacturer?: string;
  model_number?: string;
  firmware_version?: string;
  serial_number?: string;
  protocol?: string;
  settings?: Record<string, any>;
}

export interface DeviceStatus {
  device_id: string;
  name: string;
  device_type: string;
  status: string;
  battery_level?: number;
  last_sync_at?: string;
  active_stream: boolean;
}

export interface SensorMeasurement {
  id: number;
  user_id: number;
  device_id?: string;
  measurement_type: string;
  value: number;
  secondary_value?: number;
  unit: string;
  timestamp: string;
  source: string;
  quality_status: "verified" | "calibrated" | "unverified" | "outlier";
  created_at: string;
}

export interface WearableMeasurement {
  id: number;
  user_id: number;
  device_id?: string;
  platform: string;
  metric_type: string;
  value: number;
  unit: string;
  start_time?: string;
  end_time?: string;
  synced_at: string;
}

export interface IngestionResult {
  status: string;
  ingested_count: number;
  rejected_count: number;
  duplicate_count: number;
  quality_status: string;
  message: string;
}

// Healthcare Analytics Types
export interface AnalyticsOverview {
  total_measurements: number;
  active_devices_count: number;
  average_heart_rate?: number;
  latest_blood_pressure?: string;
  latest_spo2?: number;
  data_quality_score: number;
  recent_anomalies_count: number;
  timestamp: string;
}

export interface DeviceHealthItem {
  device_id: string;
  device_name: string;
  device_type: string;
  status: string;
  battery_level?: number;
  last_seen?: string;
  data_points_24h: number;
  error_rate: number;
}

export interface DataQualityReport {
  overall_quality_percentage: number;
  verified_points: number;
  calibrated_points: number;
  unverified_points: number;
  flagged_outliers: number;
  recommendations: string[];
}

// Multi-Agent Types
export interface AgentRun {
  id: string;
  user_id: number;
  agent_type: string;
  task_description: string;
  status: "pending" | "running" | "completed" | "failed" | "requires_review";
  result?: Record<string, any>;
  tool_calls?: Array<Record<string, any>>;
  human_review_required: boolean;
  human_review_notes?: string;
  started_at: string;
  completed_at?: string;
}

// ML Experimentation Types
export interface MLExperiment {
  id: string;
  model_name: string;
  experiment_name: string;
  dataset_name: string;
  parameters?: Record<string, any>;
  metrics: Record<string, any>;
  artifact_path?: string;
  version: string;
  status: string;
  created_at: string;
}
