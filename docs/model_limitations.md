# MediPredict AI — Clinical & Algorithmic Model Limitations

## 1. Scope & Regulatory Notice
MediPredict AI is an informational decision-support and medical education system. It is **NOT** a certified medical device (SaMD) and has not received formal 510(k), CE mark, or CDSCO medical device clearance.

Under no circumstances should outputs from MediPredict AI be treated as:
1. An autonomous medical diagnosis.
2. An order to initiate, alter, or discontinue prescription pharmacotherapy.
3. A substitute for immediate emergency triage or in-person evaluation by a qualified, board-certified physician.

## 2. Machine Learning Model Limitations (Celiac Risk Pipeline)
- **Cohort Bias:** The celiac disease screening model was trained on a research cohort of 2,206 individuals referred for gastrointestinal evaluation. In an unselected general screening population with lower disease prevalence, the positive predictive value (PPV) will be naturally lower.
- **Selective IgA Deficiency:** Approximately 2% to 3% of patients with celiac disease have total selective IgA deficiency. In these individuals, IgA-based tests will produce false-negative serological scores. The pipeline inspects total IgA and highlights this caveat when IgA < 0.5 g/L.
- **Gluten Dietary Status:** Patients who have already initiated a gluten-free diet before testing may have normal serum antibody titers, resulting in an underestimated risk calculation. Clinical guidelines mandate a 6-to-8 week gluten challenge prior to serological screening.
- **Biopsy Gold Standard:** Definitive diagnosis of celiac disease requires an esophagogastroduodenoscopy (EGD) with at least 4 duodenal biopsies evaluating Marsh-Oberhuber histopathological criteria.

## 3. Generative Language Model Boundaries
- **Hallucination Prevention:** The Medical RAG pipeline constrains responses to verified PubMed metadata, clinical practice guidelines (ACG, AASLD, ADA, AHA, EASL), and physiological reference intervals.
- **Emergency Keyword Interception:** Real-time regex inspection intercepts reports of acute chest pain, stroke manifestations, anaphylaxis, or suicidal ideation, overriding standard chat responses with prominent emergency dispatch guidance (call 112 / 911 / 999).
- **Human-in-the-Loop Extraction Review:** OCR and document extraction pipelines flag out-of-range or ambiguous values, prompting the user to manually verify numerical readings before adding them to clinical tracking charts.
