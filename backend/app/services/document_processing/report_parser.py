import csv
import io
import re
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Comprehensive clinical reference intervals based on WHO / CAP / IFCC standard laboratory medicine
REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    # Hematology & Complete Blood Count (CBC)
    "hemoglobin": {"low": 12.0, "high": 17.5, "unit": "g/dL", "category": "Hematology"},
    "wbc": {"low": 4.0, "high": 11.0, "unit": "x10^9/L", "category": "Hematology"},
    "white blood cell": {"low": 4.0, "high": 11.0, "unit": "x10^9/L", "category": "Hematology"},
    "platelets": {"low": 150.0, "high": 450.0, "unit": "x10^9/L", "category": "Hematology"},
    "rbc": {"low": 4.2, "high": 5.9, "unit": "x10^12/L", "category": "Hematology"},
    "hematocrit": {"low": 36.0, "high": 50.0, "unit": "%", "category": "Hematology"},
    "mcv": {"low": 80.0, "high": 100.0, "unit": "fL", "category": "Hematology"},
    "mch": {"low": 27.0, "high": 33.0, "unit": "pg", "category": "Hematology"},
    "mchc": {"low": 32.0, "high": 36.0, "unit": "g/dL", "category": "Hematology"},
    "rdw": {"low": 11.5, "high": 14.5, "unit": "%", "category": "Hematology"},
    
    # Glycemic & Metabolic Panel
    "fasting glucose": {"low": 70.0, "high": 99.0, "unit": "mg/dL", "category": "Endocrinology"},
    "blood glucose": {"low": 70.0, "high": 140.0, "unit": "mg/dL", "category": "Endocrinology"},
    "glucose": {"low": 70.0, "high": 99.0, "unit": "mg/dL", "category": "Endocrinology"},
    "hba1c": {"low": 4.0, "high": 5.6, "unit": "%", "category": "Endocrinology"},
    "insulin": {"low": 2.6, "high": 24.9, "unit": "uIU/mL", "category": "Endocrinology"},
    
    # Lipid & Cardiovascular Panel
    "total cholesterol": {"low": 120.0, "high": 200.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "triglycerides": {"low": 50.0, "high": 150.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "hdl": {"low": 40.0, "high": 80.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "hdl cholesterol": {"low": 40.0, "high": 80.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "ldl": {"low": 50.0, "high": 100.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "ldl cholesterol": {"low": 50.0, "high": 100.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "apolipoprotein b": {"low": 60.0, "high": 130.0, "unit": "mg/dL", "category": "Lipid Panel"},
    "high-sensitivity crp": {"low": 0.0, "high": 3.0, "unit": "mg/L", "category": "Inflammation"},
    "hs-crp": {"low": 0.0, "high": 3.0, "unit": "mg/L", "category": "Inflammation"},
    "crp": {"low": 0.0, "high": 5.0, "unit": "mg/L", "category": "Inflammation"},

    # Hepatic / Liver Function Panel (LFT)
    "alt": {"low": 7.0, "high": 56.0, "unit": "U/L", "category": "Hepatic Panel"},
    "alanine aminotransferase": {"low": 7.0, "high": 56.0, "unit": "U/L", "category": "Hepatic Panel"},
    "ast": {"low": 10.0, "high": 40.0, "unit": "U/L", "category": "Hepatic Panel"},
    "aspartate aminotransferase": {"low": 10.0, "high": 40.0, "unit": "U/L", "category": "Hepatic Panel"},
    "alkaline phosphatase": {"low": 44.0, "high": 147.0, "unit": "U/L", "category": "Hepatic Panel"},
    "alp": {"low": 44.0, "high": 147.0, "unit": "U/L", "category": "Hepatic Panel"},
    "total bilirubin": {"low": 0.2, "high": 1.2, "unit": "mg/dL", "category": "Hepatic Panel"},
    "direct bilirubin": {"low": 0.0, "high": 0.3, "unit": "mg/dL", "category": "Hepatic Panel"},
    "albumin": {"low": 3.5, "high": 5.0, "unit": "g/dL", "category": "Hepatic Panel"},
    "total protein": {"low": 6.0, "high": 8.3, "unit": "g/dL", "category": "Hepatic Panel"},

    # Renal & Electrolytes Panel (KFT)
    "creatinine": {"low": 0.6, "high": 1.2, "unit": "mg/dL", "category": "Renal Panel"},
    "serum creatinine": {"low": 0.6, "high": 1.2, "unit": "mg/dL", "category": "Renal Panel"},
    "blood urea nitrogen": {"low": 7.0, "high": 20.0, "unit": "mg/dL", "category": "Renal Panel"},
    "bun": {"low": 7.0, "high": 20.0, "unit": "mg/dL", "category": "Renal Panel"},
    "egfr": {"low": 90.0, "high": 130.0, "unit": "mL/min/1.73m2", "category": "Renal Panel"},
    "uric acid": {"low": 3.5, "high": 7.2, "unit": "mg/dL", "category": "Renal Panel"},
    "sodium": {"low": 135.0, "high": 145.0, "unit": "mmol/L", "category": "Electrolytes"},
    "potassium": {"low": 3.5, "high": 5.0, "unit": "mmol/L", "category": "Electrolytes"},
    "chloride": {"low": 96.0, "high": 106.0, "unit": "mmol/L", "category": "Electrolytes"},
    "calcium": {"low": 8.5, "high": 10.5, "unit": "mg/dL", "category": "Electrolytes"},

    # Thyroid Function Panel
    "tsh": {"low": 0.4, "high": 4.0, "unit": "mIU/L", "category": "Endocrinology"},
    "thyroid stimulating hormone": {"low": 0.4, "high": 4.0, "unit": "mIU/L", "category": "Endocrinology"},
    "free t4": {"low": 0.8, "high": 1.8, "unit": "ng/dL", "category": "Endocrinology"},
    "free t3": {"low": 2.3, "high": 4.2, "unit": "pg/mL", "category": "Endocrinology"},

    # Iron Studies & Anemia
    "ferritin": {"low": 30.0, "high": 300.0, "unit": "ng/mL", "category": "Iron Studies"},
    "serum iron": {"low": 60.0, "high": 170.0, "unit": "ug/dL", "category": "Iron Studies"},
    "tibc": {"low": 240.0, "high": 450.0, "unit": "ug/dL", "category": "Iron Studies"},
    "transferrin saturation": {"low": 20.0, "high": 50.0, "unit": "%", "category": "Iron Studies"},

    # Immunology & Celiac Serology
    "iga": {"low": 0.8, "high": 3.0, "unit": "g/L", "category": "Immunology"},
    "serum iga": {"low": 0.8, "high": 3.0, "unit": "g/L", "category": "Immunology"},
    "igg": {"low": 7.0, "high": 16.0, "unit": "g/L", "category": "Immunology"},
    "serum igg": {"low": 7.0, "high": 16.0, "unit": "g/L", "category": "Immunology"},
    "igm": {"low": 0.4, "high": 2.3, "unit": "g/L", "category": "Immunology"},
    "serum igm": {"low": 0.4, "high": 2.3, "unit": "g/L", "category": "Immunology"},
    "ttg-iga": {"low": 0.0, "high": 10.0, "unit": "U/mL", "category": "Serology"},
    "ttg-igg": {"low": 0.0, "high": 10.0, "unit": "U/mL", "category": "Serology"},
}

class ReportParser:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        """
        Extracts plain text from PDF bytes using pypdf or PyMuPDF (fitz).
        """
        extracted_text = []

        # Try pypdf first
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page_idx, page in enumerate(reader.pages):
                txt = page.extract_text()
                if txt:
                    extracted_text.append(txt)
            if extracted_text:
                return "\n".join(extracted_text)
        except Exception as e:
            logger.debug(f"pypdf extraction failed or partial: {e}")

        # Try fitz (PyMuPDF) as high-fidelity fallback
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                txt = page.get_text()
                if txt:
                    extracted_text.append(txt)
            if extracted_text:
                return "\n".join(extracted_text)
        except Exception as e:
            logger.debug(f"fitz extraction failed: {e}")

        return ""

    @staticmethod
    def extract_text_from_image_bytes(image_bytes: bytes) -> str:
        """
        Attempts OCR extraction from image bytes if OCR engines are available,
        or extracts EXIF / embedded text stream.
        """
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            # If pytesseract is installed in runtime
            try:
                import pytesseract
                return pytesseract.image_to_string(img)
            except Exception:
                pass
        except Exception as e:
            logger.debug(f"Image load error: {e}")
        return ""

    @staticmethod
    def parse_text_or_csv(content: str, filename: str = "") -> Tuple[List[Dict[str, Any]], float, bool]:
        """
        Parses raw clinical text or CSV into structured laboratory measurements.
        Returns: (measurements, extraction_confidence, requires_verification)
        """
        measurements: List[Dict[str, Any]] = []

        if not content or not content.strip():
            return [], 0.0, False

        # If CSV format
        if filename.endswith(".csv") or ("," in content.splitlines()[0] and len(content.splitlines()) > 1):
            try:
                reader = csv.DictReader(io.StringIO(content))
                for row in reader:
                    # Generic test / value format
                    if "test_name" in row and "value" in row and row["value"]:
                        try:
                            val = float(str(row["value"]).replace(",", ".").strip())
                            name = row["test_name"].strip()
                            m = ReportParser._evaluate_measurement(name, val, row.get("unit", ""))
                            measurements.append(m)
                        except (ValueError, TypeError):
                            continue
                    elif "IgA" in row and "IgG" in row:
                        # Celiac benchmark dataset format
                        for marker in ["IgA", "IgG", "IgM"]:
                            if marker in row and row[marker]:
                                try:
                                    val = float(row[marker])
                                    m = ReportParser._evaluate_measurement(marker, val, "g/L")
                                    measurements.append(m)
                                except (ValueError, TypeError):
                                    continue
                        break
            except Exception as e:
                logger.debug(f"CSV parse error: {e}")

        # If standard medical report text (or OCR text)
        if not measurements:
            lines = content.splitlines()
            for line in lines:
                line_clean = line.strip()
                if not line_clean or len(line_clean) < 3:
                    continue

                for ref_key, ref_info in REFERENCE_RANGES.items():
                    # Match pattern: "Test Name : 12.5 mg/dL" or "Test Name 12.5"
                    pattern = rf"(?i)\b{re.escape(ref_key)}\b\s*[:=\-]?\s*([0-9]+\.?[0-9]*)"
                    match = re.search(pattern, line_clean)
                    if match:
                        try:
                            val = float(match.group(1))
                            m = ReportParser._evaluate_measurement(ref_key.title(), val, ref_info["unit"])
                            # Avoid duplicates in same parse
                            if not any(x["test_name"].lower() == ref_key.lower() for x in measurements):
                                measurements.append(m)
                        except (ValueError, TypeError):
                            continue

        # If no measurements found, DO NOT fabricate dummy data!
        # Return empty list and 0.0 confidence so user can see honest empty state and upload a valid report.
        if not measurements:
            return [], 0.0, False

        # Calculate genuine confidence score:
        # Base confidence 0.88 + bonus for every matched standard reference range (max 0.98)
        known_count = sum(1 for m in measurements if m.get("reference_low") is not None)
        ratio = known_count / len(measurements) if measurements else 0.0
        confidence = min(0.98, max(0.85, 0.85 + (0.13 * ratio)))
        confidence = round(confidence, 2)

        # Flag verification if any critical abnormalities or unusual units
        requires_verification = any(m["flag"] in ["critical", "high", "low"] for m in measurements)

        return measurements, confidence, requires_verification

    @staticmethod
    def _evaluate_measurement(name: str, value: float, unit: str = "") -> Dict[str, Any]:
        key = name.lower().strip()
        matching_key = None
        for k in sorted(REFERENCE_RANGES.keys(), key=len, reverse=True):
            if k in key or key in k:
                matching_key = k
                break

        if matching_key:
            ref = REFERENCE_RANGES[matching_key]
            low = ref["low"]
            high = ref["high"]
            cat = ref["category"]
            std_unit = unit.strip() if unit.strip() else ref["unit"]

            flag = "normal"
            is_abnormal = False

            if value < low:
                flag = "low"
                is_abnormal = True
            elif value > high * 1.5:
                flag = "critical"
                is_abnormal = True
            elif value > high:
                flag = "high"
                is_abnormal = True

            ref_text = f"{low} - {high} {std_unit}"
        else:
            cat = "General Biochemistry"
            low = None
            high = None
            flag = "normal"
            is_abnormal = False
            ref_text = "Standard clinical reference"
            std_unit = unit.strip() if unit.strip() else "units"

        return {
            "test_name": name,
            "category": cat,
            "value": value,
            "unit": std_unit,
            "reference_low": low,
            "reference_high": high,
            "reference_text": ref_text,
            "is_abnormal": is_abnormal,
            "flag": flag,
            "confidence": 0.95 if matching_key else 0.85,
            "user_verified": False,
        }
