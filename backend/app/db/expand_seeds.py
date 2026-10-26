import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import (
    DiseaseCondition,
    GeneAssociation,
    MedicalReference,
    PersonalRecord,
    User,
)

EXPANDED_CONDITIONS = [
    {
        "name": "Chronic Kidney Disease (CKD)",
        "specialty": "Nephrology",
        "summary": "Progressive, irreversible loss of renal function defined by persistent glomerular filtration rate (eGFR) < 60 mL/min/1.73m2 or urinary albumin-to-creatinine ratio (uACR) >= 30 mg/g for at least 3 months.",
        "symptoms": ["Fatigue", "Periorbital and peripheral edema", "Nocturia", "Pruritus", "Dyspnea from fluid overload", "Anorexia"],
        "risk_factors": ["Longstanding Type 2 Diabetes", "Chronic Hypertension", "Glomerulonephritis", "Family history of renal failure", "Polycystic kidney disease"],
        "diagnostic_tests": ["Serum Creatinine and eGFR (CKD-EPI equation)", "Spot Urinary Albumin-to-Creatinine Ratio (uACR)", "Renal Ultrasound", "Electrolytes (Potassium, Bicarbonate, Phosphate)"],
        "clinical_guidelines": "KDIGO 2024 Clinical Practice Guideline for CKD. Highlights SGLT2 inhibitors, non-steroidal mineralocorticoid receptor antagonists (finerenone), and strict blood pressure control (<120 mmHg systolic).",
        "pmid_references": ["38490803", "36499878"]
    },
    {
        "name": "Essential Systemic Hypertension",
        "specialty": "Cardiology & Primary Care",
        "summary": "Chronic systemic hemodynamic disorder characterized by sustained office blood pressure >= 140/90 mmHg or 24-hour ambulatory blood pressure >= 130/80 mmHg without identifiable secondary etiology.",
        "symptoms": ["Frequently asymptomatic ('Silent Killer')", "Occipital early-morning headache", "Visual blurring", "Epistaxis", "Lightheadedness"],
        "risk_factors": ["High dietary sodium intake (>2g/day)", "Sedentary lifestyle", "Obesity (BMI >= 25)", "Advancing age", "Excessive alcohol consumption", "Obstructive sleep apnea"],
        "diagnostic_tests": ["Repeated office sphygmomanometry", "24-hour Ambulatory Blood Pressure Monitoring (ABPM)", "Electrocardiogram (LVH screening)", "Basic metabolic panel and urinalysis"],
        "clinical_guidelines": "2023 ESH / ACC Guidelines for Arterial Hypertension. Recommends initial dual combination therapy (ACEi/ARB + CCB or thiazide-like diuretic) for most patients.",
        "pmid_references": ["37345614", "29146122"]
    },
    {
        "name": "Hashimoto's Thyroiditis (Chronic Autoimmune Thyroiditis)",
        "specialty": "Endocrinology",
        "summary": "The most common etiology of primary hypothyroidism in iodine-sufficient regions. An autoimmune disease characterized by lymphocytic infiltration of thyroid tissue and anti-TPO/anti-Tg autoantibodies leading to gradual thyroid destruction.",
        "symptoms": ["Cold intolerance", "Unexplained weight gain", "Constipation", "Dry skin and brittle hair", "Bradycardia", "Depressive mood", "Puffy facies"],
        "risk_factors": ["Female sex (8:1 ratio)", "Coexisting autoimmune disorders (Celiac disease, Type 1 Diabetes, Vitiligo)", "Family history", "HLA-DR3 / HLA-DR5 alleles"],
        "diagnostic_tests": ["Serum Thyroid-Stimulating Hormone (TSH)", "Free Thyroxine (Free T4)", "Anti-Thyroid Peroxidase (Anti-TPO) antibodies", "Thyroid Ultrasound showing coarse heterogenous echotexture"],
        "clinical_guidelines": "ATA Practice Guidelines for Hypothyroidism. Daily levothyroxine monotherapy titrated to normalize serum TSH (0.5–2.5 mIU/L in young adults, 1.0–4.0 in elderly).",
        "pmid_references": ["25289512", "27521067"]
    },
    {
        "name": "Familial Hypercholesterolemia (FH)",
        "specialty": "Cardiology & Lipidology",
        "summary": "An autosomal dominant disorder of lipid metabolism characterized by severely elevated LDL cholesterol levels from birth, tendon xanthomas, and dramatically accelerated premature atherosclerotic coronary artery disease.",
        "symptoms": ["Tendon xanthomas (Achilles tendon, extensor tendons of hand)", "Xanthelasma palpebrarum", "Corneal arcus before age 45", "Angina pectoris at young age"],
        "risk_factors": ["Pathogenic variant in LDLR, APOB, or PCSK9 genes", "First-degree relative with premature CAD (<55 men, <65 women)", "Baseline untreated LDL-C >= 190 mg/dL"],
        "diagnostic_tests": ["Fasting Lipid Panel (LDL-C >= 190 mg/dL in adults, >= 160 mg/dL in children)", "Simon Broome or Dutch Lipid Clinic Network Diagnostic Scoring", "Genetic panel testing for LDLR / APOB / PCSK9 mutations"],
        "clinical_guidelines": "2023 AHA Scientific Statement on Familial Hypercholesterolemia. Targeted LDL-C reduction of >= 50% using high-potency statins plus ezetimibe and PCSK9 inhibitors.",
        "pmid_references": ["31473270", "30422245"]
    },
    {
        "name": "Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD)",
        "specialty": "Hepatology & Gastroenterology",
        "summary": "Hepatic steatosis affecting >= 5% of hepatocytes demonstrated on imaging or histology, occurring in the presence of at least one cardiometabolic risk factor (overweight, dyslipidemia, insulin resistance, or hypertension) and absence of significant alcohol intake.",
        "symptoms": ["Vague right upper quadrant dullness", "Fatigue", "Hepatomegaly", "Frequently asymptomatic during early steatosis"],
        "risk_factors": ["Type 2 Diabetes Mellitus", "Obesity and visceral adiposity", "Dyslipidemia (high triglycerides, low HDL)", "Metabolic syndrome", "PNPLA3 gene polymorphism"],
        "diagnostic_tests": ["Abdominal Ultrasound", "Non-invasive fibrosis score (FIB-4 Index)", "Transient Elastography (FibroScan CAP / LSM)", "Serum ALT / AST / Ferritin"],
        "clinical_guidelines": "2024 AASLD / EASL Clinical Practice Guidelines for MASLD. Emphasizes structured lifestyle weight loss >=7-10%, GLP-1 receptor agonists, and resmetirom for non-cirrhotic MASH with stage F2-F3 fibrosis.",
        "pmid_references": ["38851411", "30076044"]
    },
    {
        "name": "Sickle Cell Disease & Beta-Hemoglobinopathies",
        "specialty": "Hematology",
        "summary": "Autosomal recessive hemoglobinopathy caused by a point mutation in the HBB gene (Glu6Val, producing HbS). Deoxygenated HbS polymerizes into rigid fibers, causing erythrocyte sickling, vaso-occlusion, tissue ischemia, and severe hemolytic anemia.",
        "symptoms": ["Acute painful vaso-occlusive crises (dactylitis, bone/chest pain)", "Chronic hemolytic anemia and jaundice", "Splenic sequestration", "Acute chest syndrome", "Fatigue"],
        "risk_factors": ["Homozygosity for HbS mutation (HbSS)", "Compound heterozygosity (HbS/beta-thalassemia, HbSC)", "African, Mediterranean, Middle Eastern, or Indian tribal ancestry"],
        "diagnostic_tests": ["Hemoglobin electrophoresis or High-Performance Liquid Chromatography (HPLC)", "Peripheral blood smear showing sickle forms and Howell-Jolly bodies", "Complete Blood Count and reticulocyte count", "HBB genetic confirmatory testing"],
        "clinical_guidelines": "ASH Guidelines for Sickle Cell Disease (2023). Hydroxyurea therapy is standard disease-modifying pharmacotherapy; L-glutamine, voxelotor, crizanlizumab, and CRISPR-Cas9 gene therapies (exa-cel).",
        "pmid_references": ["32840673", "16446107"]
    }
]

EXPANDED_GENES = [
    {
        "gene_symbol": "LDLR",
        "gene_name": "Low-Density Lipoprotein Receptor",
        "chromosome": "19p13.2",
        "inheritance_pattern": "Autosomal Dominant",
        "associated_condition": "Familial Hypercholesterolemia Type 1",
        "doid": "DOID:13810",
        "omim_id": "OMIM:606945",
        "pmid": "31473270",
        "description": "Encodes the cell-surface glycoprotein receptor responsible for receptor-mediated endocytosis of cholesterol-rich LDL particles from systemic circulation into hepatocytes.",
        "clinical_uncertainty_note": "Over 2,000 distinct pathogenic variants identified. Homozygotes exhibit extreme coronary calcification in childhood; heterozygotes benefit dramatically from early statin/PCSK9i therapy."
    },
    {
        "gene_symbol": "PCSK9",
        "gene_name": "Proprotein Convertase Subtilisin/Kexin Type 9",
        "chromosome": "1p32.3",
        "inheritance_pattern": "Autosomal Dominant / Co-dominant",
        "associated_condition": "Familial Hypercholesterolemia Type 3 / Hypobetalipoproteinemia",
        "doid": "DOID:13810",
        "omim_id": "OMIM:607786",
        "pmid": "30422245",
        "description": "Serine protease that binds to the EGF-A domain of the LDL receptor, targeting it for lysosomal degradation and decreasing cell-surface clearance of circulating atherogenic LDL particles.",
        "clinical_uncertainty_note": "Gain-of-function mutations cause severe premature hypercholesterolemia. Loss-of-function variants (e.g. R46L) confer lifelong 80% protection against coronary heart disease."
    },
    {
        "gene_symbol": "APOE",
        "gene_name": "Apolipoprotein E",
        "chromosome": "19q13.32",
        "inheritance_pattern": "Co-dominant Alleles (e2, e3, e4)",
        "associated_condition": "Type III Hyperlipoproteinemia & Late-Onset Alzheimer Susceptibility",
        "doid": "DOID:13810",
        "omim_id": "OMIM:107741",
        "pmid": "30422245",
        "description": "Essential constituent of chylomicrons, VLDL, and HDL that serves as the ligand for hepatic receptor clearance of atherogenic remnant lipoproteins.",
        "clinical_uncertainty_note": "The APOE-epsilon4 allele is a major genetic susceptibility factor for coronary atherosclerosis and sporadic Alzheimer's disease, but represents risk enhancement rather than a deterministic clinical diagnosis."
    },
    {
        "gene_symbol": "CFTR",
        "gene_name": "Cystic Fibrosis Transmembrane Conductance Regulator",
        "chromosome": "7q31.2",
        "inheritance_pattern": "Autosomal Recessive",
        "associated_condition": "Cystic Fibrosis & Congenital Bilateral Absence of Vas Deferens",
        "doid": "DOID:1485",
        "omim_id": "OMIM:602421",
        "pmid": "34012068",
        "description": "ATP-binding cassette transporter functioning as an epithelial cyclic AMP-regulated chloride and bicarbonate channel across pulmonary, pancreatic, and digestive mucosal surfaces.",
        "clinical_uncertainty_note": "Common delta-F508 (p.Phe508del) mutation causes protein misfolding. Highly responsive to CFTR modulator combination therapy (elexacaftor/tezacaftor/ivacaftor)."
    },
    {
        "gene_symbol": "HBB",
        "gene_name": "Hemoglobin Subunit Beta",
        "chromosome": "11p15.4",
        "inheritance_pattern": "Autosomal Recessive",
        "associated_condition": "Sickle Cell Disease & Beta-Thalassemia Major/Intermedia",
        "doid": "DOID:10923",
        "omim_id": "OMIM:141900",
        "pmid": "16446107",
        "description": "Encodes beta-globin protein subunit of adult hemoglobin A (HbA, alpha2-beta2). Single nucleotide substitution (c.20A>T, p.Glu7Val) causes sickle hemoglobin polymerization.",
        "clinical_uncertainty_note": "Coinheritance of alpha-thalassemia or elevated fetal hemoglobin (HbF) through hereditary persistence of fetal hemoglobin significantly ameliorates clinical severity."
    },
    {
        "gene_symbol": "TCF7L2",
        "gene_name": "Transcription Factor 7 Like 2",
        "chromosome": "10q25.2",
        "inheritance_pattern": "Co-dominant Susceptibility (rs7903146)",
        "associated_condition": "Type 2 Diabetes Mellitus Susceptibility",
        "doid": "DOID:9351",
        "omim_id": "OMIM:602228",
        "pmid": "38078580",
        "description": "High-mobility group box-containing transcription factor that regulates proglucagon gene expression, incretin hormone response (GLP-1), and pancreatic beta-cell survival.",
        "clinical_uncertainty_note": "The risk T-allele of rs7903146 is the single most reproducible polygenic contributor to T2D in genome-wide association studies (odds ratio ~1.4 per allele)."
    },
    {
        "gene_symbol": "TP53",
        "gene_name": "Tumor Protein P53",
        "chromosome": "17p13.1",
        "inheritance_pattern": "Autosomal Dominant",
        "associated_condition": "Li-Fraumeni Syndrome & Hereditary Multi-Cancer Predisposition",
        "doid": "DOID:2841",
        "omim_id": "OMIM:191170",
        "pmid": "34012068",
        "description": "Nuclear sequence-specific transcription factor termed the 'Guardian of the Genome', coordinating DNA damage response, apoptosis, and cellular senescence.",
        "clinical_uncertainty_note": "Carriers require lifelong annual whole-body MRI, brain MRI, and breast MRI screening starting in childhood under the Toronto Surveillance Protocol."
    }
]

EXPANDED_REFERENCES = [
    {
        "title": "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
        "authors": "Navaneethan SD, Zoungas S, Caramori ML, et al.",
        "journal": "Kidney International",
        "publication_year": 2024,
        "doi": "10.1016/j.kint.2023.10.018",
        "pmid": "38490803",
        "category": "Nephrology",
        "evidence_level": "Level 1A Practice Guideline",
        "url": "https://pubmed.ncbi.nlm.nih.gov/38490803/",
        "abstract": "Comprehensive evidence-based guidelines on CKD staging using GFR and albuminuria grids, slowing progression with SGLT2 inhibitors and finerenone, and managing cardiovascular risk.",
        "key_findings": "Routine combined eGFR and uACR testing enables early detection. SGLT2 inhibitors reduce renal progression by 37% across diabetic and non-diabetic CKD."
    },
    {
        "title": "2023 ESH Guidelines for the management of arterial hypertension",
        "authors": "Mancia G, Kreutz R, Brunström M, et al.",
        "journal": "Journal of Hypertension",
        "publication_year": 2023,
        "doi": "10.1097/HJH.0000000000003480",
        "pmid": "37345614",
        "category": "Cardiology",
        "evidence_level": "Level 1A Guideline",
        "url": "https://pubmed.ncbi.nlm.nih.gov/37345614/",
        "abstract": "Updated European guidelines on office and out-of-office blood pressure evaluation, cardiovascular risk stratification, single-pill combination therapy, and target BP goals.",
        "key_findings": "Target office BP < 130/80 mmHg in adults aged 18-79 if well tolerated. Favors early single-pill combination therapy to maximize patient adherence."
    },
    {
        "title": "2019 ESC/EAS Guidelines for the management of dyslipidaemias: lipid modification to reduce cardiovascular risk",
        "authors": "Mach F, Baigent C, Catapano AL, et al.",
        "journal": "European Heart Journal",
        "publication_year": 2020,
        "doi": "10.1093/eurheartj/ehz455",
        "pmid": "31473270",
        "category": "Cardiology & Lipidology",
        "evidence_level": "Clinical Practice Guideline",
        "url": "https://pubmed.ncbi.nlm.nih.gov/31473270/",
        "abstract": "Rigorous thresholds for LDL-C reduction according to total cardiovascular risk, recommending < 55 mg/dL for very-high-risk patients and >= 50% baseline reduction.",
        "key_findings": "No lower threshold for LDL-C safety observed down to 20 mg/dL. Recommends statin + ezetimibe + PCSK9 inhibitor stepwise intensification."
    },
    {
        "title": "EASL-EASD-EASO Clinical Practice Guidelines on the management of metabolic dysfunction-associated steatotic liver disease (MASLD)",
        "authors": "European Association for the Study of the Liver",
        "journal": "Journal of Hepatology",
        "publication_year": 2024,
        "doi": "10.1016/j.jhep.2024.04.031",
        "pmid": "38851411",
        "category": "Hepatology & Endocrinology",
        "evidence_level": "Multi-Society Guideline",
        "url": "https://pubmed.ncbi.nlm.nih.gov/38851411/",
        "abstract": "Nomenclature consensus on MASLD and comprehensive algorithms for non-invasive fibrosis assessment (FIB-4, vibration-controlled transient elastography) in primary and secondary care.",
        "key_findings": "FIB-4 < 1.3 excludes advanced fibrosis with >90% negative predictive value. Weight loss >= 10% promotes steatohepatitis resolution and fibrosis regression."
    },
    {
        "title": "American College of Medical Genetics and Genomics (ACMG) recommendations for reporting secondary findings in clinical sequencing",
        "authors": "Miller DT, Lee K, Chung WK, et al.",
        "journal": "Genetics in Medicine",
        "publication_year": 2021,
        "doi": "10.1038/s41436-021-01172-3",
        "pmid": "34012068",
        "category": "Medical Genetics",
        "evidence_level": "ACMG Policy Guideline",
        "url": "https://pubmed.ncbi.nlm.nih.gov/34012068/",
        "abstract": "Curated list of 78 medically actionable genes (ACMG SF v3.0) where pathogenic variants warrant mandatory return to patient for life-saving preventive clinical intervention.",
        "key_findings": "Covers high-penetrance cancer syndromes (BRCA1/2, Lynch), cardiovascular channelopathies/cardiomyopathies (LDLR, PCSK9, MYH7), and malignant hyperthermia."
    }
]

def run_seed():
    db = SessionLocal()
    print("Beginning expanded evidence seeding...")

    # 1. Expand Conditions
    existing_cond_names = {c.name.lower() for c in db.query(DiseaseCondition).all()}
    added_conds = 0
    for c in EXPANDED_CONDITIONS:
        if c["name"].lower() not in existing_cond_names:
            cond = DiseaseCondition(
                name=c["name"],
                specialty=c["specialty"],
                summary=c["summary"],
                symptoms=c["symptoms"],
                risk_factors=c["risk_factors"],
                diagnostic_tests=c["diagnostic_tests"],
                clinical_guidelines=c["clinical_guidelines"],
                pmid_references=c["pmid_references"]
            )
            db.add(cond)
            added_conds += 1
    db.commit()
    print(f"Added {added_conds} new disease conditions. Total: {db.query(DiseaseCondition).count()}")

    # 2. Expand Genes
    existing_genes = {g.gene_symbol.lower() for g in db.query(GeneAssociation).all()}
    added_genes = 0
    for g in EXPANDED_GENES:
        if g["gene_symbol"].lower() not in existing_genes:
            gene = GeneAssociation(
                gene_symbol=g["gene_symbol"],
                gene_name=g["gene_name"],
                chromosome=g["chromosome"],
                inheritance_pattern=g["inheritance_pattern"],
                associated_condition=g["associated_condition"],
                doid=g["doid"],
                omim_id=g["omim_id"],
                pmid=g["pmid"],
                description=g["description"],
                clinical_uncertainty_note=g["clinical_uncertainty_note"]
            )
            db.add(gene)
            added_genes += 1
    db.commit()
    print(f"Added {added_genes} new genetic associations. Total: {db.query(GeneAssociation).count()}")

    # 3. Expand Medical References
    existing_refs = {r.pmid for r in db.query(MedicalReference).all() if r.pmid}
    added_refs = 0
    for r in EXPANDED_REFERENCES:
        if r["pmid"] not in existing_refs:
            ref = MedicalReference(
                title=r["title"],
                authors=r["authors"],
                journal=r["journal"],
                publication_year=r["publication_year"],
                doi=r["doi"],
                pmid=r["pmid"],
                category=r["category"],
                evidence_level=r["evidence_level"],
                url=r["url"],
                abstract=r["abstract"],
                key_findings=r["key_findings"]
            )
            db.add(ref)
            added_refs += 1
    db.commit()
    print(f"Added {added_refs} new peer-reviewed medical references. Total: {db.query(MedicalReference).count()}")

    # 4. Seed Personal Records for Patient User
    demo_user = db.query(User).filter(User.email == "demo@medipredict.ai").first()
    if demo_user and db.query(PersonalRecord).filter(PersonalRecord.user_id == demo_user.id).count() <= 1:
        records_data = [
            {
                "title": "Comprehensive Annual Health Checkup & Executive Blood Panel",
                "category": "Annual Health Checkup",
                "doctor": "Dr. Sarah Chen, MD (Apollo Health City)",
                "summary": "Metabolic screening showed elevated fasting glucose (114 mg/dL) and borderline LDL-C (142 mg/dL). Recommended Mediterranean diet and 150 mins aerobic exercise weekly.",
                "tags": ["Preventive Medicine", "Executive Health", "Lipid Panel", "Glucose"]
            },
            {
                "title": "Gastroenterology Consultation: Celiac Serology Follow-Up",
                "category": "Gastroenterology",
                "doctor": "Dr. Rajesh Iyer, MD, DM (Gastro Sciences)",
                "summary": "Discussed elevated tTG-IgA titers. Confirmed strict compliance with gluten-containing diet prior to diagnostic upper endoscopy with duodenal bulb biopsies.",
                "tags": ["Celiac Disease", "Serology", "Endoscopy", "Biopsy"]
            },
            {
                "title": "Cardiology Risk Evaluation & 24-hr Holter Telemetry",
                "category": "Cardiology",
                "doctor": "Dr. Anita Desai, MD (Cardiovascular Institute)",
                "summary": "24-hour Holter monitoring demonstrated sinus rhythm throughout. Average heart rate 72 bpm, no nocturnal ventricular ectopy or pauses > 2.0s.",
                "tags": ["Cardiology", "Holter Monitor", "ECG", "Telemetry"]
            },
            {
                "title": "COVID-19 & Seasonal Influenza Annual Immunization",
                "category": "Immunization",
                "doctor": "City Health Immunization Clinic",
                "summary": "Administered annual quadrivalent influenza vaccine (Batch #FL9081) and bivalent COVID-19 booster. No adverse reactions observed during 15-minute post-injection monitoring.",
                "tags": ["Vaccination", "Influenza", "COVID-19", "Immunization"]
            }
        ]
        for rec in records_data:
            pr = PersonalRecord(
                user_id=demo_user.id,
                title=rec["title"],
                category=rec["category"],
                record_date=datetime.datetime.utcnow() - datetime.timedelta(days=hash(rec["title"]) % 90 + 5),
                doctor_or_facility=rec["doctor"],
                summary=rec["summary"],
                tags=rec["tags"]
            )
            db.add(pr)
        db.commit()
        print(f"Added personal records for user {demo_user.id}. Total: {db.query(PersonalRecord).count()}")

    db.close()
    print("Expanded evidence database seeding successfully completed.")

if __name__ == "__main__":
    run_seed()
