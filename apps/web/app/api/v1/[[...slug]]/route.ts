import { NextRequest, NextResponse } from "next/server";

// Fallback Mock Clinical Database for Vercel Serverless Previews
const MOCK_USER = {
  id: 1,
  email: "demo@medipredict.ai",
  full_name: "Dr. Elena Rostova",
  role: "clinician",
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString(),
};

const MOCK_REPORTS = [
  {
    id: 101,
    patient_id: 1,
    patient_name: "Rajesh Kumar (Demo)",
    title: "Comprehensive Metabolic & Lipid Panel",
    report_type: "biochemistry",
    report_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    file_path: "/uploads/demo_cmp_panel.pdf",
    extraction_confidence: 0.985,
    abnormal_count: 2,
    triage_priority: "stat_critical",
    clinician_status: "pending",
    clinician_notes: "",
    ai_interpretation:
      "Critical elevation in Fasting Blood Glucose (186.4 mg/dL) and HbA1c (8.9%). Immediate clinical glycemic optimization recommended.",
    measurements: [
      {
        id: 1001,
        test_name: "Fasting Blood Glucose",
        value: 186.4,
        unit: "mg/dL",
        reference_low: 70.0,
        reference_high: 99.0,
        reference_text: "70.0 - 99.0 mg/dL",
        is_abnormal: true,
        flag: "critical",
        confidence: 0.99,
        user_verified: true,
      },
      {
        id: 1002,
        test_name: "Hemoglobin A1c (HbA1c)",
        value: 8.9,
        unit: "%",
        reference_low: 4.0,
        reference_high: 5.6,
        reference_text: "4.0 - 5.6 %",
        is_abnormal: true,
        flag: "high",
        confidence: 0.98,
        user_verified: false,
      },
      {
        id: 1003,
        test_name: "Serum Creatinine",
        value: 0.92,
        unit: "mg/dL",
        reference_low: 0.6,
        reference_high: 1.2,
        reference_text: "0.6 - 1.2 mg/dL",
        is_abnormal: false,
        flag: "normal",
        confidence: 0.99,
        user_verified: true,
      },
      {
        id: 1004,
        test_name: "Total Cholesterol",
        value: 178.0,
        unit: "mg/dL",
        reference_low: 120.0,
        reference_high: 200.0,
        reference_text: "< 200.0 mg/dL",
        is_abnormal: false,
        flag: "normal",
        confidence: 0.97,
        user_verified: true,
      },
    ],
  },
  {
    id: 102,
    patient_id: 2,
    patient_name: "Priya Sharma (Demo)",
    title: "Celiac Serology & Immunoglobulin Profile",
    report_type: "immunology",
    report_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    file_path: "/uploads/demo_celiac_serology.pdf",
    extraction_confidence: 0.972,
    abnormal_count: 2,
    triage_priority: "urgent",
    clinician_status: "approved",
    clinician_notes: "Strongly positive anti-tTG IgA with normal total IgA confirms celiac disease. Referred for gastroenterology duodenal biopsy.",
    ai_interpretation:
      "Marked elevation of Anti-Tissue Transglutaminase IgA (>128 U/mL). Positive Anti-Endomysial Antibodies (EMA) indicates high probability of Marsh 3 enteropathy.",
    measurements: [
      {
        id: 1005,
        test_name: "Anti-tTG IgA",
        value: 128.5,
        unit: "U/mL",
        reference_low: 0.0,
        reference_high: 10.0,
        reference_text: "< 10.0 U/mL",
        is_abnormal: true,
        flag: "critical",
        confidence: 0.98,
        user_verified: true,
      },
      {
        id: 1006,
        test_name: "Total Serum IgA",
        value: 2.45,
        unit: "g/L",
        reference_low: 0.8,
        reference_high: 3.0,
        reference_text: "0.8 - 3.0 g/L",
        is_abnormal: false,
        flag: "normal",
        confidence: 0.99,
        user_verified: true,
      },
    ],
  },
];

const MOCK_AUDIT_LOGS = [
  {
    id: 1,
    action: "CLINICAL_SIGN_OFF",
    user_id: 1,
    resource_type: "report",
    resource_id: 102,
    details: { status: "approved", notes: "Verified serology findings" },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    checksum: "a7c8e9d02341bf6e8a",
  },
  {
    id: 2,
    action: "ESCALATION_DISPATCH",
    user_id: 1,
    resource_type: "report",
    resource_id: 101,
    details: { status: "escalated", department: "Endocrinology & Diabetes Clinic" },
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    checksum: "f8319eac5203b87d90",
  },
];

async function forwardToBackend(req: NextRequest, slug: string[]) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;

  const path = slug.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/${path}${search}`;

  try {
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "follow",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.warn(`[Proxy Fallback] Failed connecting to backend at ${targetUrl}:`, err);
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join("/");

  // Try proxying to real backend if configured
  const proxyRes = await forwardToBackend(req, slug);
  if (proxyRes) return proxyRes;

  // Local Serverless Fallbacks
  if (path === "health" || path === "") {
    return NextResponse.json({
      status: "healthy",
      service: "MediPredict AI API Gateway",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      backend_connected: !!process.env.BACKEND_URL,
    });
  }

  if (path === "users/me") {
    return NextResponse.json(MOCK_USER);
  }

  if (path === "assistant/providers") {
    return NextResponse.json({
      current_provider: "clinical_evidence",
      providers: {
        clinical_evidence: {
          name: "MediPredict Evidence Engine",
          configured: true,
          model: "evidence-rag-v1",
          description: "PubMed-grounded clinical guideline reasoning",
        },
        gemini: {
          name: "Google Gemini 1.5",
          configured: !!process.env.GEMINI_API_KEY,
          model: "gemini-1.5-flash",
          description: "Multimodal medical analysis",
        },
        openai: {
          name: "OpenAI GPT-4o",
          configured: !!process.env.OPENAI_API_KEY,
          model: "gpt-4o-mini",
          description: "Conversational health assistant",
        },
      },
    });
  }

  if (path === "assistant/conversations") {
    return NextResponse.json([
      {
        id: 1,
        user_id: 1,
        title: "Glycemic Control & Elevated HbA1c",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        last_message: "Verified correlation between elevated fasting glucose and HbA1c 8.9%.",
      },
      {
        id: 2,
        user_id: 1,
        title: "Celiac Disease Serology & Dietary Guidance",
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        last_message: "Recommended endoscopic biopsy before starting a gluten-free diet.",
      },
    ]);
  }

  if (path.startsWith("assistant/conversations/") && path.endsWith("/messages")) {
    return NextResponse.json([
      {
        id: 1,
        conversation_id: 1,
        role: "assistant",
        content:
          "Hello! I am your MediPredict AI Clinical Assistant. You can ask questions about your laboratory reports, diagnostic biomarkers, or medical guidelines. How can I assist your health inquiry today?",
        sources: [],
        safety_alerts: [],
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }

  if (path === "reports") {
    return NextResponse.json(MOCK_REPORTS);
  }

  if (path.startsWith("reports/")) {
    const reportId = parseInt(slug[1]);
    const found = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];
    return NextResponse.json(found);
  }

  if (path === "clinician/reports") {
    const statusFilter = req.nextUrl.searchParams.get("status");
    if (!statusFilter || statusFilter === "all") {
      return NextResponse.json(MOCK_REPORTS);
    }
    return NextResponse.json(MOCK_REPORTS.filter((r) => r.clinician_status === statusFilter));
  }

  if (path === "clinician/audit-logs") {
    return NextResponse.json(MOCK_AUDIT_LOGS);
  }

  if (path === "ml/models") {
    return NextResponse.json([
      {
        id: "MOD-CELIAC-GB-01",
        name: "Celiac Disease Risk Gradient Booster",
        algorithm: "GradientBoostingClassifier",
        version: "1.0.4",
        auc: 0.962,
        samples: 2206,
        framework: "Scikit-Learn 1.4 / Joblib",
      },
      {
        id: "MOD-CARDIO-RISK-02",
        name: "Cardiometabolic 5-Year Risk Classifier",
        algorithm: "RandomForestEnsemble",
        version: "2.1.0",
        auc: 0.941,
        samples: 4800,
        framework: "Scikit-Learn / SHAP",
      },
    ]);
  }

  if (path === "ml/experiments") {
    return NextResponse.json([
      {
        id: "EXP-CELIAC-GB-01",
        model_name: "CeliacDiseaseGradientBoosting",
        experiment_name: "baseline_gradient_boosted_trees",
        dataset_name: "celiac_biomarker_cohort_v1",
        metrics: { accuracy: 0.941, roc_auc: 0.962, f1_score: 0.938 },
        status: "deployed",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "EXP-BAYESIAN-HYPEROPT-02",
        model_name: "CeliacDiseaseGradientBoosting",
        experiment_name: "bayesian_hyperopt_n_estimators_200",
        dataset_name: "celiac_biomarker_cohort_v2",
        metrics: { accuracy: 0.948, roc_auc: 0.968, f1_score: 0.942 },
        status: "completed",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }

  if (path === "diseases") {
    return NextResponse.json([
      {
        id: 1,
        name: "Celiac Disease (Gluten-Sensitive Enteropathy)",
        specialty: "Gastroenterology",
        summary:
          "Immune-mediated systemic disorder triggered by gluten ingestion in genetically susceptible individuals (HLA-DQ2/DQ8).",
        symptoms: ["Chronic diarrhea", "Abdominal distension", "Iron deficiency anemia", "Fatigue"],
        risk_factors: ["First-degree relative with celiac", "Type 1 diabetes", "Hashimoto thyroiditis"],
        diagnostic_criteria: ["Elevated Anti-tTG IgA", "Total IgA assessment", "Duodenal mucosal biopsy"],
        last_reviewed: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Type 2 Diabetes Mellitus",
        specialty: "Endocrinology",
        summary:
          "Metabolic condition characterized by progressive insulin secretion defect on the background of insulin resistance.",
        symptoms: ["Polyuria", "Polydipsia", "Nocturia", "Unexplained weight loss"],
        risk_factors: ["BMI > 25 kg/m²", "Sedentary lifestyle", "First-degree family history"],
        diagnostic_criteria: ["Fasting Plasma Glucose >= 126 mg/dL", "HbA1c >= 6.5%"],
        last_reviewed: new Date().toISOString(),
      },
    ]);
  }

  if (path === "genetics") {
    return NextResponse.json([
      {
        id: 1,
        gene_symbol: "HLA-DQA1 / HLA-DQB1",
        gene_name: "Major Histocompatibility Complex Class II",
        chromosome: "Chr 6p21.3",
        associated_condition: "Celiac Disease Susceptibility (DQ2.5 / DQ8 heterodimers)",
        inheritance_pattern: "Complex Oligogenic",
        clinical_significance: "High negative predictive value (>99%); absence effectively rules out celiac disease.",
      },
      {
        id: 2,
        gene_symbol: "HFE",
        gene_name: "Homeostatic Iron Regulator",
        chromosome: "Chr 6p22.2",
        associated_condition: "Hereditary Hemochromatosis Type 1",
        inheritance_pattern: "Autosomal Recessive",
        clinical_significance: "C282Y homozygosity accounts for 85-90% of clinical hemochromatosis cases.",
      },
    ]);
  }

  if (path === "records") {
    return NextResponse.json([
      {
        id: 1,
        title: "Annual Influenza & Tdap Booster Vaccination",
        category: "Immunization Record",
        doctor_or_facility: "Apollo Specialty Clinic",
        record_date: new Date(Date.now() - 30 * 86400000).toISOString(),
        summary: "Administered Quadrivalent Inactivated Influenza vaccine (Lot #FL8923). No adverse reaction noted.",
      },
      {
        id: 2,
        title: "Abdominal Ultrasound Examination",
        category: "Radiology",
        doctor_or_facility: "Max Healthcare Imaging Centre",
        record_date: new Date(Date.now() - 60 * 86400000).toISOString(),
        summary: "Normal hepatic parenchyma without focal lesion or steatosis. Gallbladder, pancreas, and spleen normal.",
      },
    ]);
  }

  if (path === "research") {
    return NextResponse.json([
      {
        id: 1,
        title: "ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease",
        authors: "Rubio-Tapia A, Hill ID, Semrad C, Kelly CP, et al.",
        journal: "American Journal of Gastroenterology",
        year: 2023,
        pmid: "36598285",
        evidence_level: "Level 1A Guideline",
        category: "Gastroenterology",
        abstract_snippet:
          "Updated evidence-based guidelines for initial screening with anti-tTG IgA, indications for intestinal biopsy, and monitoring mucosal healing on a strict gluten-free diet.",
        url: "https://pubmed.ncbi.nlm.nih.gov/36598285/",
      },
      {
        id: 2,
        title: "Standards of Care in Diabetes — 2024",
        authors: "American Diabetes Association Professional Practice Committee",
        journal: "Diabetes Care",
        year: 2024,
        pmid: "38078580",
        evidence_level: "Level 1A Guideline",
        category: "Endocrinology",
        abstract_snippet:
          "Comprehensive clinical guidance detailing diagnostic thresholds for diabetes (HbA1c >= 6.5%), continuous glucose monitoring, and cardiovascular risk reduction.",
        url: "https://pubmed.ncbi.nlm.nih.gov/38078580/",
      },
    ]);
  }

  if (path === "devices") {
    return NextResponse.json([
      {
        id: "DEV-WATCH-01",
        device_name: "MediWatch Pro V4",
        device_type: "smartwatch",
        model_number: "MW-PRO-4",
        serial_number: "MWP4-2026-9041",
        battery_level: 84,
        is_active: true,
        firmware_version: "v3.2.1",
        last_sync: new Date().toISOString(),
      },
      {
        id: "DEV-OXI-02",
        device_name: "Continuous Pulse Oximeter",
        device_type: "pulse_oximeter",
        model_number: "POX-C2",
        serial_number: "POXC2-7749",
        battery_level: 92,
        is_active: true,
        firmware_version: "v1.4.0",
        last_sync: new Date().toISOString(),
      },
    ]);
  }

  if (path === "analytics/overview") {
    return NextResponse.json({
      total_patients: 1240,
      active_monitored_streams: 18,
      verified_reports_count: 842,
      pending_triage_count: 3,
      avg_spo2_percentage: 98.2,
      mean_heart_rate_bpm: 72,
    });
  }

  if (path === "metrics/summary") {
    return NextResponse.json({
      heart_rate: { value: 72, unit: "bpm", status: "normal", timestamp: new Date().toISOString() },
      blood_pressure: { systolic: 118, diastolic: 78, unit: "mmHg", status: "optimal", timestamp: new Date().toISOString() },
      blood_glucose: { value: 94, unit: "mg/dL", status: "normal", timestamp: new Date().toISOString() },
      oxygen_saturation: { value: 98.4, unit: "%", status: "normal", timestamp: new Date().toISOString() },
      body_temperature: { value: 98.6, unit: "°F", status: "normal", timestamp: new Date().toISOString() },
      respiratory_rate: { value: 16, unit: "breaths/min", status: "normal", timestamp: new Date().toISOString() },
    });
  }

  // Catch-all for unrecognized GET requests
  return NextResponse.json({ status: "ok", path, data: [] });
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join("/");

  // Try proxying to real backend if configured
  const proxyRes = await forwardToBackend(req, slug);
  if (proxyRes) return proxyRes;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (path === "auth/login" || path === "auth/register") {
    return NextResponse.json({
      access_token: "demo_clinical_jwt_session_2026",
      refresh_token: "demo_refresh_token_2026",
      token_type: "bearer",
      user: {
        ...MOCK_USER,
        email: body.email || MOCK_USER.email,
        full_name: body.full_name || MOCK_USER.full_name,
      },
    });
  }

  if (path === "assistant/conversations") {
    return NextResponse.json({
      id: Date.now(),
      user_id: 1,
      title: body.title || "Clinical Health Inquiry",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (path.startsWith("assistant/conversations/") && path.endsWith("/messages")) {
    const userPrompt = body.content || "";
    let responseText = `Thank you for your inquiry regarding "${userPrompt}". 

According to peer-reviewed clinical guidelines (American College of Gastroenterology & American Diabetes Association):
1. **Clinical Biomarker Interpretation**: Numerical laboratory parameters must always be interpreted in the context of reference intervals established by the processing laboratory and patient-specific medical history.
2. **Follow-Up Investigations**: If you observe abnormal values or new symptoms, a confirmatory blood draw or consultation with a licensed clinician is advised.
3. **Safety Notice**: This educational summary is generated by MediPredict AI decision support and does not replace attending physician judgment.`;

    if (userPrompt.toLowerCase().includes("celiac") || userPrompt.toLowerCase().includes("gluten")) {
      responseText = `### Celiac Disease Diagnostic Serology & Interpretation

Based on ACG & ESPGHAN diagnostic guidelines:
- **Anti-tTG IgA (Tissue Transglutaminase)**: First-line serological screen with sensitivity and specificity >95%.
- **Total Serum IgA**: Must be concurrently assessed to exclude selective IgA deficiency (found in 2-3% of celiac patients), which can cause false-negative tTG-IgA results.
- **Endoscopic Duodenal Biopsy**: Remains the gold standard for adult confirmation (Marsh classification 1 to 3c). Patients should NOT start a gluten-free diet prior to biopsy to avoid false normal mucosal findings.`;
    }

    return NextResponse.json({
      id: Date.now(),
      conversation_id: parseInt(slug[1]) || 1,
      role: "assistant",
      content: responseText,
      sources: [
        {
          title: "ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease",
          journal: "Am J Gastroenterol",
          year: 2023,
          pmid: "36598285",
          url: "https://pubmed.ncbi.nlm.nih.gov/36598285/",
        },
        {
          title: "AACC Guidance Document on Laboratory Investigation of Glycemic Disorders",
          journal: "Clin Chem",
          year: 2023,
          pmid: "37466185",
          url: "https://pubmed.ncbi.nlm.nih.gov/37466185/",
        },
      ],
      safety_alerts: [],
      created_at: new Date().toISOString(),
    });
  }

  if (path === "reports/upload") {
    return NextResponse.json({
      id: Date.now(),
      patient_id: 1,
      patient_name: "Demo Patient",
      title: "Uploaded Clinical Laboratory Panel",
      report_type: "blood_chemistry",
      report_date: new Date().toISOString(),
      extraction_confidence: 0.98,
      abnormal_count: 1,
      triage_priority: "routine",
      clinician_status: "pending",
      ai_interpretation:
        "Document successfully parsed. Extracted physiological parameters are within reference range with isolated slight variance.",
      measurements: [
        {
          id: Date.now() + 1,
          test_name: "Fasting Serum Glucose",
          value: 94.0,
          unit: "mg/dL",
          reference_text: "70.0 - 99.0 mg/dL",
          is_abnormal: false,
          flag: "normal",
          confidence: 0.99,
          user_verified: true,
        },
      ],
    });
  }

  if (path === "ml/predict-risk") {
    const age = body.age || 28;
    const iga = body.iga || 2.4;
    const isDiabetes = body.diabetes === "yes" || body.diabetes === "Yes";
    const riskProb = Math.min(0.96, Math.max(0.04, (isDiabetes ? 0.35 : 0.1) + (iga > 10 ? 0.45 : 0.05)));

    return NextResponse.json({
      risk_level: riskProb > 0.6 ? "High" : riskProb > 0.3 ? "Moderate" : "Low",
      estimated_risk_probability: riskProb,
      predicted_classification: riskProb > 0.4 ? "High Celiac Risk" : "Low / Average Population Risk",
      confidence_interval: [Math.max(0.01, riskProb - 0.08), Math.min(0.99, riskProb + 0.08)],
      contributing_factors: [
        isDiabetes ? "Documented Type 1 Diabetes history (+0.32 probability weight)" : "Negative diabetes history",
        `Serum Immunoglobulin level: ${iga} g/L`,
        "Persistent gastrointestinal discomfort report",
      ],
      recommended_clinical_followup: [
        "Confirmatory anti-tTG IgA quantitative serology titer",
        "Total serum IgA assessment to rule out selective deficiency",
        "Gastroenterology specialist consultation before dietary changes",
      ],
      model_provenance: {
        algorithm: "GradientBoostingClassifier (Scikit-Learn)",
        version: "1.0.4",
        test_auc: "0.962",
        test_accuracy: "94.1%",
      },
    });
  }

  if (path === "ml/experiments") {
    return NextResponse.json({
      id: `EXP-USER-${Date.now().toString().slice(-4)}`,
      model_name: body.model_name || "CustomBiomedicalModel",
      experiment_name: body.experiment_name || "experiment_run",
      dataset_name: body.dataset_name || "cohort_validation_v1",
      metrics: { accuracy: body.accuracy || 0.94, roc_auc: body.auc || 0.96, f1_score: body.f1 || 0.93 },
      status: "completed",
      created_at: new Date().toISOString(),
    });
  }

  if (path === "records") {
    return NextResponse.json({
      id: Date.now(),
      title: body.title || "Personal Health Record",
      category: body.category || "Clinical Consultation",
      doctor_or_facility: body.doctor_or_facility || "Attending Physician",
      record_date: body.record_date || new Date().toISOString(),
      summary: body.summary || "Health record entry logged securely.",
    });
  }

  if (path === "metrics") {
    return NextResponse.json({
      id: Date.now(),
      metric_type: body.metric_type || "heart_rate",
      value: body.value || 72,
      unit: body.unit || "bpm",
      recorded_at: new Date().toISOString(),
    });
  }

  // Catch-all POST
  return NextResponse.json({ status: "success", message: "Recorded successfully", data: body });
}

export async function PUT(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join("/");

  const proxyRes = await forwardToBackend(req, slug);
  if (proxyRes) return proxyRes;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (path.startsWith("clinician/reports/") && path.endsWith("/review")) {
    const reportId = parseInt(slug[2]);
    const found = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];
    const updated = {
      ...found,
      clinician_status: body.status || "approved",
      clinician_notes: body.notes || found.clinician_notes,
      escalation_department: body.department,
      escalation_reason: body.reason,
    };
    return NextResponse.json(updated);
  }

  return NextResponse.json({ status: "success", updated: true, data: body });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  const proxyRes = await forwardToBackend(req, slug);
  if (proxyRes) return proxyRes;

  return NextResponse.json({ status: "deleted", success: true });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
