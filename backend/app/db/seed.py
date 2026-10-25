import csv
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.models import (
    DiseaseCondition,
    GeneAssociation,
    HealthMeasurement,
    LaboratoryMeasurement,
    MedicalReference,
    MedicalReport,
    PersonalRecord,
    User,
    UserConsent,
)

def seed_database(db: Session):
    # 1. Seed Medical Conditions
    if db.query(DiseaseCondition).count() == 0:
        conditions = [
            DiseaseCondition(
                name="Celiac Disease",
                specialty="Gastroenterology & Immunology",
                summary=(
                    "An immune-mediated systemic enteropathy triggered by dietary gluten ingestion in genetically "
                    "predisposed individuals carrying HLA-DQ2 or HLA-DQ8. Characterized by mucosal inflammation, "
                    "crypt hyperplasia, and villous atrophy of the small intestine."
                ),
                symptoms=["Chronic diarrhea", "Abdominal distension", "Unintended weight loss", "Fatigue", "Steatorrhea", "Iron-deficiency anemia"],
                risk_factors=["First-degree relative with celiac disease", "Type 1 Diabetes Mellitus", "Autoimmune thyroiditis", "HLA-DQ2.5 or DQ8 heterodimers"],
                diagnostic_tests=["Serum IgA anti-tissue transglutaminase (tTG-IgA)", "Total serum IgA", "Endomysial antibody (EMA-IgA)", "Upper endoscopy with duodenal bulb & distal biopsies"],
                clinical_guidelines="ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease (2023). Patients must maintain a gluten-containing diet prior to diagnostic testing.",
                pmid_references=["36637387", "30552885"],
            ),
            DiseaseCondition(
                name="Hereditary Hemochromatosis",
                specialty="Hepatology & Hematology",
                summary=(
                    "An autosomal recessive metabolic disorder characterized by inappropriately high intestinal iron absorption, "
                    "leading to progressive multi-organ parenchymal iron deposition, cirrhosis, cardiomyopathy, and diabetes."
                ),
                symptoms=["Chronic fatigue", "Arthralgia (2nd/3rd MCP joints)", "Hepatomegaly", "Bronze hyperpigmentation of skin", "Erectile dysfunction"],
                risk_factors=["Homozygosity for HFE p.C282Y mutation", "Compound heterozygosity for C282Y/H63D", "Family history of iron overload", "Male sex (earlier phenotypic expression)"],
                diagnostic_tests=["Fasting transferrin saturation (>45%)", "Serum ferritin (>300 ng/mL in men, >200 ng/mL in women)", "HFE genetic mutation analysis", "Hepatic T2* MRI for liver iron concentration (LIC)"],
                clinical_guidelines="AASLD Practice Guidelines on Hemochromatosis (2022). Therapeutic phlebotomy remains primary treatment to achieve target serum ferritin 50–100 ng/mL.",
                pmid_references=["21858852", "30076044"],
            ),
            DiseaseCondition(
                name="Type 2 Diabetes Mellitus",
                specialty="Endocrinology & Metabolism",
                summary=(
                    "A complex metabolic disorder characterized by progressive loss of adequate beta-cell insulin secretion, "
                    "frequently superimposed on a background of insulin resistance in liver, skeletal muscle, and adipose tissue."
                ),
                symptoms=["Polyuria", "Polydipsia", "Nocturia", "Blurred vision", "Paresthesias in lower extremities", "Delayed wound healing"],
                risk_factors=["BMI >= 25 kg/m2 (>=23 in Asian populations)", "Physical inactivity", "First-degree family history", "History of gestational diabetes", "Hypertension (>=130/80 mmHg)"],
                diagnostic_tests=["Fasting Plasma Glucose (>=126 mg/dL)", "HbA1c (>=6.5%)", "2-hour Oral Glucose Tolerance Test (OGTT >=200 mg/dL)", "Random plasma glucose >=200 mg/dL with classic hyperglycemia symptoms"],
                clinical_guidelines="ADA Standards of Care in Diabetes (2024). Emphasizes lifestyle modification, early combination therapy, and cardiovascular/renal protective agents (SGLT2i / GLP-1RA).",
                pmid_references=["38078580", "36499878"],
            ),
            DiseaseCondition(
                name="Atherosclerotic Cardiovascular Disease (ASCVD)",
                specialty="Cardiology & Preventive Medicine",
                summary=(
                    "Fibrofatty plaque accumulation in the arterial intima leading to progressive luminal narrowing, "
                    "endothelial dysfunction, and acute atherothrombotic vascular events such as myocardial infarction and ischemic stroke."
                ),
                symptoms=["Angina pectoris", "Dyspnea on exertion", "Intermittent claudication", "Transient neurological deficits"],
                risk_factors=["Elevated Apolipoprotein B / LDL-C", "Hypertension", "Cigarette smoking", "Diabetes mellitus", "Elevated high-sensitivity CRP", "Family history of premature ASCVD"],
                diagnostic_tests=["Coronary Artery Calcium (CAC) score", "CT Coronary Angiography", "Lipid panel (Total, LDL-C, HDL-C, Triglycerides)", "High-sensitivity Troponin", "Exercise treadmill test"],
                clinical_guidelines="2023 AHA/ACC Clinical Practice Guideline. Highlights high-intensity statin therapy, ezetimibe, PCSK9 inhibitors, and strict blood pressure control.",
                pmid_references=["37471501", "30422245"],
            ),
            DiseaseCondition(
                name="Hepatocellular Carcinoma (HCC)",
                specialty="Hepatology & Surgical Oncology",
                summary=(
                    "Primary malignancy of hepatocytes typically developing in the setting of chronic liver inflammation and cirrhosis. "
                    "Major etiologies include chronic viral hepatitis (HBV, HCV), alcohol-related liver disease (ARLD), and non-alcoholic fatty liver disease (MASLD)."
                ),
                symptoms=["Right upper quadrant dull pain", "Unexplained weight loss", "Worsening ascites or jaundice in previously stable cirrhosis", "Early satiety"],
                risk_factors=["Liver cirrhosis of any etiology", "Chronic Hepatitis B infection (even without cirrhosis)", "Heavy alcohol consumption", "Hepatic iron overload"],
                diagnostic_tests=["Abdominal ultrasound surveillance every 6 months", "Serum alpha-fetoprotein (AFP)", "Multiphasic dynamic contrast-enhanced CT or MRI (LI-RADS criteria)"],
                clinical_guidelines="EASL Clinical Practice Guidelines: Management of Hepatocellular Carcinoma (2023). Early surveillance enables curative resection, transplantation, or thermal ablation.",
                pmid_references=["29622428", "30076044"],
            ),
        ]
        for c in conditions:
            db.add(c)
        db.commit()

    # 2. Seed Genetic Associations from real research datasets
    if db.query(GeneAssociation).count() == 0:
        genes = [
            GeneAssociation(
                gene_symbol="HFE",
                gene_name="Homeostatic Iron Regulator",
                chromosome="6p22.2",
                inheritance_pattern="Autosomal Recessive",
                associated_condition="Hereditary Hemochromatosis Type 1",
                doid="DOID:2352",
                omim_id="OMIM:235200",
                pmid="16446107",
                description="Encodes a membrane protein that interacts with transferrin receptor to regulate iron absorption in duodenal enterocytes and hepatocytes.",
                clinical_uncertainty_note="Incomplete penetrance: Only a fraction of C282Y homozygotes develop clinical disease and end-organ damage without cofactors like alcohol or hepatic steatosis.",
            ),
            GeneAssociation(
                gene_symbol="BMP2",
                gene_name="Bone Morphogenetic Protein 2",
                chromosome="20p12.3",
                inheritance_pattern="Autosomal Recessive",
                associated_condition="Hemochromatosis Type 1 Modifier",
                doid="DOID:0111029",
                omim_id="OMIM:112261",
                pmid="29462744",
                description="Ligand of the TGF-beta superfamily involved in hepatic hepcidin transcriptional activation via the SMAD signaling pathway.",
                clinical_uncertainty_note="Variants act primarily as modifiers of iron burden rather than primary monogenic causative mutations.",
            ),
            GeneAssociation(
                gene_symbol="FTH1",
                gene_name="Ferritin Heavy Chain 1",
                chromosome="11q12.3",
                inheritance_pattern="Autosomal Dominant",
                associated_condition="Hemochromatosis Type 5",
                doid="DOID:0111031",
                omim_id="OMIM:134770",
                pmid="11528400",
                description="Catalyzes the oxidation of ferrous iron (Fe2+) to ferric iron (Fe3+) inside the ferritin shell for safe cellular storage.",
                clinical_uncertainty_note="Rare autosomal dominant mutations alter the iron-pore conformation, causing isolated hyperferritinemia without parenchymal iron toxicity.",
            ),
            GeneAssociation(
                gene_symbol="HAMP",
                gene_name="Hepcidin Antimicrobial Peptide",
                chromosome="19q13.12",
                inheritance_pattern="Autosomal Recessive",
                associated_condition="Juvenile Hemochromatosis Type 2B",
                doid="DOID:2352",
                omim_id="OMIM:606464",
                pmid="12469120",
                description="The master systemic iron hormone; induces endocytosis and degradation of ferroportin, halting iron release from macrophages and enterocytes.",
                clinical_uncertainty_note="Deleterious mutations cause severe juvenile-onset iron loading with cardiomyopathy and hypogonadism before age 30.",
            ),
            GeneAssociation(
                gene_symbol="ALAS2",
                gene_name="5'-Aminolevulinate Synthase 2",
                chromosome="Xp11.21",
                inheritance_pattern="X-Linked",
                associated_condition="Sideroblastic Anemia & Secondary Iron Overload",
                doid="DOID:2352",
                omim_id="OMIM:300752",
                pmid="16446107",
                description="Rate-limiting enzyme for erythroid heme biosynthesis. Defects cause ineffective erythropoiesis and profound secondary iron accumulation.",
                clinical_uncertainty_note="Variable expressivity in heterozygous females due to skewed X-chromosome inactivation (lyonization).",
            ),
            GeneAssociation(
                gene_symbol="MTHFR",
                gene_name="Methylenetetrahydrofolate Reductase",
                chromosome="1p36.22",
                inheritance_pattern="Autosomal Recessive / Co-dominant",
                associated_condition="Homocysteine & Folate Metabolism Variation (rs1801133)",
                doid="DOID:1470",
                omim_id="OMIM:607093",
                pmid="31908298",
                description="Converts 5,10-methylenetetrahydrofolate to 5-methyltetrahydrofolate, the primary circulatory form of folate necessary for homocysteine remethylation.",
                clinical_uncertainty_note="Common polymorphic variant (C677T / rs1801133) is present in 20-40% of population. Clinical guidelines do not support routine testing without hyperhomocysteinemia.",
            ),
            GeneAssociation(
                gene_symbol="BRCA1",
                gene_name="BRCA1 DNA Repair Associated",
                chromosome="17q21.31",
                inheritance_pattern="Autosomal Dominant",
                associated_condition="Hereditary Breast and Ovarian Cancer Syndrome (HBOC)",
                doid="DOID:5688",
                omim_id="OMIM:113705",
                pmid="32840673",
                description="Essential tumor suppressor protein participating in homologous recombination repair of double-strand DNA breaks and cell cycle checkpoint control.",
                clinical_uncertainty_note="Variants of Uncertain Significance (VUS) require clinical genetic counselor evaluation and must not be used to justify prophylactic surgery.",
            ),
        ]
        for g in genes:
            db.add(g)
        db.commit()

    # 3. Seed Medical References (Grounded Literature with genuine PubMed IDs)
    if db.query(MedicalReference).count() == 0:
        references = [
            MedicalReference(
                title="ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease",
                authors="Rubio-Tapia A, Hill ID, Semrad C, Kelly CP, Lebwohl B",
                journal="The American Journal of Gastroenterology",
                publication_year=2023,
                doi="10.14309/ajg.0000000000002162",
                pmid="36637387",
                category="Gastroenterology",
                evidence_level="Level 1A Guideline",
                url="https://pubmed.ncbi.nlm.nih.gov/36637387/",
                abstract="Updated evidence-based recommendations on celiac disease serology, duodenal biopsy, genetic screening, and lifelong gluten-free dietary adherence.",
                key_findings="tTG-IgA with total serum IgA is initial test of choice. Gluten-free diet must not be started prior to diagnostic endoscopy.",
            ),
            MedicalReference(
                title="Standards of Care in Diabetes—2024",
                authors="American Diabetes Association Professional Practice Committee",
                journal="Diabetes Care",
                publication_year=2024,
                doi="10.2337/dc24-Sint",
                pmid="38078580",
                category="Endocrinology",
                evidence_level="Clinical Practice Guideline",
                url="https://pubmed.ncbi.nlm.nih.gov/38078580/",
                abstract="The 2024 Standards of Care provides current clinical practice recommendations for screening, diagnostic thresholds, pharmacotherapy, and prevention of diabetes complications.",
                key_findings="Confirms FPG >= 126 mg/dL or HbA1c >= 6.5% for diagnosis. Supports continuous glucose monitoring and early organ-protective therapy.",
            ),
            MedicalReference(
                title="AASLD Practice Guidelines: Hemochromatosis",
                authors="Bacon BR, Adams PC, Kowdley KV, Powell LW, Tavill AS",
                journal="Hepatology",
                publication_year=2022,
                doi="10.1002/hep.24330",
                pmid="21858852",
                category="Hepatology",
                evidence_level="Clinical Guideline",
                url="https://pubmed.ncbi.nlm.nih.gov/21858852/",
                abstract="Guidelines for screening, diagnosis, and therapeutic management of genetic iron overload disorders, including HFE and non-HFE hemochromatosis.",
                key_findings="Transferrin saturation >45% warrants ferritin measurement and HFE genetic mutation testing. Therapeutic phlebotomy is standard of care.",
            ),
            MedicalReference(
                title="2023 AHA/ACC Guideline for the Management of Patients With Chronic Coronary Disease",
                authors="Virani SS, Newby LK, Arnold SV, et al.",
                journal="Circulation",
                publication_year=2023,
                doi="10.1161/CIR.0000000000001168",
                pmid="37471501",
                category="Cardiology",
                evidence_level="Guideline & Meta-Analysis",
                url="https://pubmed.ncbi.nlm.nih.gov/37471501/",
                abstract="Comprehensive recommendations on lifestyle modification, antiplatelet therapy, lipid lowering, and coronary revascularization for chronic coronary disease.",
                key_findings="Aggressive LDL-C reduction targets, SGLT2 inhibitors and GLP-1 receptor agonists in diabetes with ASCVD, and blood pressure control < 130/80 mmHg.",
            ),
            MedicalReference(
                title="EASL Clinical Practice Guidelines: Management of Hepatocellular Carcinoma",
                authors="European Association for the Study of the Liver",
                journal="Journal of Hepatology",
                publication_year=2023,
                doi="10.1016/j.jhep.2018.03.019",
                pmid="29622428",
                category="Oncology & Hepatology",
                evidence_level="Clinical Practice Guideline",
                url="https://pubmed.ncbi.nlm.nih.gov/29622428/",
                abstract="Evidence-based recommendations on HCC surveillance in liver cirrhosis, non-invasive imaging diagnosis (LI-RADS), and multidisciplinary management.",
                key_findings="Semiannual ultrasound surveillance in patients with cirrhosis significantly improves early detection and overall survival rates.",
            ),
        ]
        for r in references:
            db.add(r)
        db.commit()

    # 4. Seed Demo User Account
    demo_user = db.query(User).filter(User.email == "demo@medipredict.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@medipredict.ai",
            hashed_password=get_password_hash("MedicalAI2026!"),
            full_name="Dr. Sarah Chen, MD",
            role="clinician",
            is_active=True,
            is_verified=True,
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Consents
        for c_type in ["ai_data_analysis", "health_records_storage", "anonymized_research"]:
            db.add(UserConsent(user_id=demo_user.id, consent_type=c_type, granted=True, version="1.0"))
        db.commit()

        # Seed realistic baseline laboratory report
        sample_report = MedicalReport(
            user_id=demo_user.id,
            title="Annual Comprehensive Metabolic & Lipid Panel",
            report_type="Biochemical Blood Panel",
            report_date=datetime.datetime.utcnow() - datetime.timedelta(days=14),
            file_name="lab_results_oct2026.pdf",
            status="verified",
            summary="Routine annual screening. Identified mildly elevated Fasting Glucose (108 mg/dL) and LDL Cholesterol (132 mg/dL).",
            ai_interpretation=(
                "Analysis of biochemical blood panel reveals mild dysglycemia (impaired fasting glucose) and moderate atherogenic "
                "lipoprotein elevation (LDL 132 mg/dL). Renal markers (eGFR, Creatinine), hepatic enzymes (ALT, AST), and complete "
                "blood counts are within normal physiological limits. Recommend lifestyle modification and repeat lipid panel in 6 months."
            ),
            extraction_confidence=0.98,
            requires_verification=False,
        )
        db.add(sample_report)
        db.commit()
        db.refresh(sample_report)

        # Measurements
        measurements = [
            ("Fasting Glucose", 108.0, "mg/dL", 70.0, 99.0, "70 - 99 mg/dL", True, "high", True),
            ("HbA1c", 5.8, "%", 4.0, 5.6, "4.0 - 5.6 %", True, "high", True),
            ("Total Cholesterol", 212.0, "mg/dL", 120.0, 200.0, "120 - 200 mg/dL", True, "high", True),
            ("LDL Cholesterol", 132.0, "mg/dL", 50.0, 100.0, "50 - 100 mg/dL", True, "high", True),
            ("HDL Cholesterol", 54.0, "mg/dL", 40.0, 80.0, "40 - 80 mg/dL", False, "normal", True),
            ("Triglycerides", 130.0, "mg/dL", 50.0, 150.0, "50 - 150 mg/dL", False, "normal", True),
            ("Hemoglobin", 14.8, "g/dL", 12.0, 17.5, "12.0 - 17.5 g/dL", False, "normal", True),
            ("Platelets", 240.0, "x10^9/L", 150.0, 450.0, "150 - 450 x10^9/L", False, "normal", True),
            ("ALT", 24.0, "U/L", 7.0, 56.0, "7 - 56 U/L", False, "normal", True),
            ("AST", 22.0, "U/L", 10.0, 40.0, "10 - 40 U/L", False, "normal", True),
            ("Ferritin", 145.0, "ng/mL", 30.0, 300.0, "30 - 300 ng/mL", False, "normal", True),
            ("Serum IgA", 2.1, "g/L", 0.8, 3.0, "0.8 - 3.0 g/L", False, "normal", True),
        ]
        for name, val, unit, r_low, r_high, r_text, is_ab, flag, ver in measurements:
            meas = LaboratoryMeasurement(
                report_id=sample_report.id,
                test_name=name,
                value=val,
                unit=unit,
                reference_low=r_low,
                reference_high=r_high,
                reference_text=r_text,
                is_abnormal=is_ab,
                flag=flag,
                user_verified=ver,
                confidence=0.98,
            )
            db.add(meas)
        db.commit()

        # Seed Health Measurements over time for time-series charts
        now = datetime.datetime.utcnow()
        days_ago = [90, 60, 30, 14, 2]
        
        # Blood pressure readings (systolic / diastolic)
        bp_values = [(128, 82), (126, 80), (124, 78), (122, 78), (120, 76)]
        for (sys_val, dia_val), d in zip(bp_values, days_ago):
            db.add(HealthMeasurement(
                user_id=demo_user.id,
                metric_type="blood_pressure",
                value=float(sys_val),
                secondary_value=float(dia_val),
                unit="mmHg",
                recorded_at=now - datetime.timedelta(days=d),
                source="Clinical Sphygmomanometer",
            ))

        # Blood glucose readings
        glucose_values = [112.0, 109.0, 108.0, 104.0, 98.0]
        for val, d in zip(glucose_values, days_ago):
            db.add(HealthMeasurement(
                user_id=demo_user.id,
                metric_type="blood_glucose",
                value=val,
                unit="mg/dL",
                recorded_at=now - datetime.timedelta(days=d),
                source="Fasting Glucometer",
            ))

        # Heart rate readings
        hr_values = [74.0, 72.0, 70.0, 68.0, 68.0]
        for val, d in zip(hr_values, days_ago):
            db.add(HealthMeasurement(
                user_id=demo_user.id,
                metric_type="heart_rate",
                value=val,
                unit="bpm",
                recorded_at=now - datetime.timedelta(days=d),
                source="Wearable ECG Sensor",
            ))

        # HbA1c
        db.add(HealthMeasurement(
            user_id=demo_user.id,
            metric_type="hba1c",
            value=5.8,
            unit="%",
            recorded_at=now - datetime.timedelta(days=14),
            source="Laboratory Venipuncture",
        ))

        # Weight
        weights = [76.5, 75.8, 75.2, 74.8, 74.5]
        for val, d in zip(weights, days_ago):
            db.add(HealthMeasurement(
                user_id=demo_user.id,
                metric_type="weight",
                value=val,
                unit="kg",
                recorded_at=now - datetime.timedelta(days=d),
                source="Smart Scale",
            ))

        # Personal health records
        db.add(PersonalRecord(
            user_id=demo_user.id,
            title="Influenza & Tdap Booster Vaccination Record",
            category="Immunization Record",
            record_date=now - datetime.timedelta(days=45),
            doctor_or_facility="Memorial Clinical Center",
            summary="Quadrivalent influenza vaccine and tetanus-diphtheria-pertussis booster administered with zero acute adverse reaction.",
            tags=["Immunization", "Preventive Care", "Annual Wellness"],
        ))

        db.commit()
