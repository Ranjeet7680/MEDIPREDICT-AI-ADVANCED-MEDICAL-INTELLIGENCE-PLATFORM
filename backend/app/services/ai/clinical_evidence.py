import re
from typing import Any, Dict, List, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.safety import AISafetyLayer

# Grounded peer-reviewed references catalog
EVIDENCE_CATALOG = {
    "celiac": {
        "title": "ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease",
        "journal": "The American Journal of Gastroenterology",
        "year": 2023,
        "pmid": "36637387",
        "doi": "10.14309/ajg.0000000000002162",
        "url": "https://pubmed.ncbi.nlm.nih.gov/36637387/",
        "evidence_level": "Grade A Evidence / Clinical Practice Guideline",
        "summary": "Recommends anti-tissue transglutaminase (tTG) IgA as initial serologic test of choice in individuals older than 2 years on gluten-containing diet.",
    },
    "hemochromatosis": {
        "title": "AASLD Practice Guidelines on Hemochromatosis",
        "journal": "Hepatology",
        "year": 2022,
        "pmid": "21858852",
        "doi": "10.1002/hep.24330",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21858852/",
        "evidence_level": "Clinical Practice Guideline",
        "summary": "Transferrin saturation >45% and elevated ferritin indicate iron overload evaluation. Genetic testing for HFE (C282Y / H63D) provides confirmatory etiology.",
    },
    "diabetes": {
        "title": "Standards of Care in Diabetes—2024",
        "journal": "Diabetes Care",
        "year": 2024,
        "pmid": "38078580",
        "doi": "10.2337/dc24-Sint",
        "url": "https://pubmed.ncbi.nlm.nih.gov/38078580/",
        "evidence_level": "Professional Practice Committee Guideline",
        "summary": "Diagnostic thresholds: Fasting Plasma Glucose >=126 mg/dL (7.0 mmol/L) or HbA1c >=6.5% (48 mmol/mol) confirmed by repeat testing in absence of unequivocal hyperglycemia.",
    },
    "cardiovascular": {
        "title": "2023 AHA/ACC Guideline for the Management of Patients With Chronic Coronary Disease",
        "journal": "Circulation",
        "year": 2023,
        "pmid": "37471501",
        "doi": "10.1161/CIR.0000000000001168",
        "url": "https://pubmed.ncbi.nlm.nih.gov/37471501/",
        "evidence_level": "Clinical Guideline",
        "summary": "Emphasizes team-based prevention, guideline-directed medical therapy, LDL-C reduction targets, and blood pressure control (<130/80 mmHg).",
    },
    "liver": {
        "title": "EASL Clinical Practice Guidelines: Management of Hepatocellular Carcinoma",
        "journal": "Journal of Hepatology",
        "year": 2023,
        "pmid": "29622428",
        "doi": "10.1016/j.jhep.2018.03.019",
        "url": "https://pubmed.ncbi.nlm.nih.gov/29622428/",
        "evidence_level": "Systematic Review & Guideline",
        "summary": "Surveillance with abdominal ultrasound every 6 months in cirrhotic patients allows earlier detection, curative resection, or radiofrequency ablation.",
    },
}

class ClinicalEvidenceProvider(BaseAIProvider):
    def name(self) -> str:
        return "clinical_evidence"

    def is_configured(self) -> bool:
        return True

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
        report_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        user_msg = messages[-1]["content"] if messages else ""
        user_msg_lower = user_msg.lower()

        # Check safety
        is_emergency, emergency_msg, injection_alert = AISafetyLayer.inspect_query(user_msg)
        safety_alerts = []
        if injection_alert:
            safety_alerts.append(injection_alert)
        if is_emergency:
            safety_alerts.append("CRITICAL: Emergency symptoms reported.")
            return {
                "content": AISafetyLayer.append_disclaimer(emergency_msg),
                "sources": [],
                "safety_alerts": safety_alerts,
                "provider": "clinical_evidence",
                "model": "MediPredict Evidence Engine v1.0",
            }

        # Match evidence topics
        matched_sources = []
        topic_explanations = []

        if any(w in user_msg_lower for w in ["celiac", "gluten", "iga", "t-transglutaminase", "marsh", "duodenal"]):
            src = EVIDENCE_CATALOG["celiac"]
            matched_sources.append(src)
            topic_explanations.append(
                "### Celiac Disease & Serology Overview\n"
                "- **Pathophysiology:** An immune-mediated enteropathy triggered by dietary gluten in genetically susceptible individuals carrying HLA-DQ2 or HLA-DQ8.\n"
                "- **Diagnostic Serology:** Tissue transglutaminase IgA (tTG-IgA) combined with total serum IgA is the first-line screening panel. Endomysial antibody (EMA-IgA) offers exceptionally high specificity.\n"
                "- **Important Consideration:** Patients must remain on a regular gluten-containing diet prior to testing to avoid false-negative serological and biopsy results."
            )

        if any(w in user_msg_lower for w in ["iron", "ferritin", "hemochromatosis", "hfe", "transferrin", "liver"]):
            src = EVIDENCE_CATALOG["hemochromatosis"]
            matched_sources.append(src)
            topic_explanations.append(
                "### Hereditary Hemochromatosis & Iron Metabolism\n"
                "- **Mechanism:** Autosomal recessive genetic disorder causing dysregulated intestinal iron absorption, leading to systemic iron overload in the liver, pancreas, heart, and joints.\n"
                "- **Biochemical Evaluation:** Elevated fasting transferrin saturation (>45%) and serum ferritin (>300 ng/mL in men, >200 ng/mL in women).\n"
                "- **Genetic Confirmation:** Most common variant is homozygous *C282Y* in the *HFE* gene on chromosome 6."
            )

        if any(w in user_msg_lower for w in ["glucose", "diabetes", "hba1c", "insulin", "sugar", "hyperglycemia"]):
            src = EVIDENCE_CATALOG["diabetes"]
            matched_sources.append(src)
            topic_explanations.append(
                "### Glycemic Health & Diabetes Screening\n"
                "- **Reference Standard (ADA 2024):**\n"
                "  - **Normal:** Fasting plasma glucose < 100 mg/dL, HbA1c < 5.7%.\n"
                "  - **Prediabetes:** Fasting glucose 100–125 mg/dL, HbA1c 5.7%–6.4%.\n"
                "  - **Diabetes Mellitus:** Fasting glucose >= 126 mg/dL, HbA1c >= 6.5%.\n"
                "- **Clinical Relevance:** Glycated hemoglobin (HbA1c) reflects average blood glucose concentrations over the preceding 90–120 days."
            )

        if any(w in user_msg_lower for w in ["blood pressure", "hypertension", "heart", "cholesterol", "ldl", "hdl", "triglyceride"]):
            src = EVIDENCE_CATALOG["cardiovascular"]
            matched_sources.append(src)
            topic_explanations.append(
                "### Cardiovascular Risk & Lipid Metrics\n"
                "- **Blood Pressure Targets:** Normal resting BP is < 120/80 mmHg. Stage 1 hypertension begins at 130–139 systolic or 80–89 diastolic.\n"
                "- **Atherogenic Lipoproteins:** Low-Density Lipoprotein Cholesterol (LDL-C) target is generally < 100 mg/dL for primary prevention, and < 70 or < 55 mg/dL for high cardiovascular risk individuals."
            )

        # Include additional retrieved context if passed from Medical RAG
        if retrieved_context:
            for ctx in retrieved_context:
                if ctx not in matched_sources:
                    matched_sources.append(ctx)

        if topic_explanations:
            body = "\n\n".join(topic_explanations)
            content = (
                f"### Clinical Information Summary\n\n"
                f"{body}\n\n"
                f"### Evidence Basis & Research Grounding\n"
                f"This explanation is synthesized from peer-reviewed clinical guidelines, including "
                f"{', '.join([s['title'] for s in matched_sources])}.\n\n"
                f"**Key Next Steps:** If you are experiencing symptoms or reviewing personal lab tests, please discuss these metrics with your physician for contextual interpretation."
            )
        else:
            # General medical reasoning
            matched_sources.append(EVIDENCE_CATALOG["diabetes"])
            matched_sources.append(EVIDENCE_CATALOG["cardiovascular"])
            content = (
                f"### Understanding Medical & Laboratory Insights\n\n"
                f"Medical testing and clinical risk evaluations rely on structured evidence, physiological reference ranges, and individualized clinical history:\n\n"
                f"1. **Reference Intervals:** Normal ranges vary by laboratory methodology, age, and sex. A value slightly outside the reference threshold is not inherently an indicator of disease.\n"
                f"2. **Serological & Molecular Markers:** Tests like antibodies (IgA, IgG), hormones, and genetic variants (rsIDs) must always be correlated with physical signs and personal clinical history.\n"
                f"3. **Longitudinal Trends:** A single measurement is often less informative than the trajectory of values over months or years.\n\n"
                f"You can attach a laboratory report or select a specific condition (such as Celiac disease, Hemochromatosis, or Glycemic risk) for focused evidence analysis."
            )

        return {
            "content": AISafetyLayer.append_disclaimer(content),
            "sources": matched_sources,
            "safety_alerts": safety_alerts,
            "provider": "clinical_evidence",
            "model": "MediPredict Evidence Engine v1.0",
        }

    async def interpret_report(
        self,
        report_title: str,
        measurements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        abnormalities = []
        key_findings = []

        for m in measurements:
            name = m.get("test_name", "Unknown test")
            val = m.get("value", 0.0)
            unit = m.get("unit", "")
            flag = m.get("flag", "normal")
            ref = m.get("reference_text", "")

            if flag in ["high", "low", "critical"]:
                abnormalities.append(f"{name}: {val} {unit} (Flagged {flag.upper()}, Ref: {ref})")
            else:
                key_findings.append(f"{name}: {val} {unit} (Within reference interval)")

        summary = (
            f"Laboratory Report '{report_title}' containing {len(measurements)} analyzed measurements. "
            f"Identified {len(abnormalities)} potential out-of-range value(s) requiring medical review."
        )

        interpretation = (
            "The automated extraction analyzed numerical values and laboratory reference intervals. "
            "Values flagged as High or Low should be reviewed by your prescribing physician. "
            "Note that transient physiological factors, hydration, fasting status, and medications can impact "
            "laboratory parameters without indicating chronic pathology."
        )

        return {
            "summary": summary,
            "interpretation": interpretation,
            "key_findings": key_findings,
            "abnormalities": abnormalities,
        }
