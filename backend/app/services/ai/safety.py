import re
from typing import Dict, List, Optional, Tuple

EMERGENCY_PATTERNS = [
    r"\b(crushing chest pain|chest pressure.*arm|left arm pain.*sweat|heart attack)\b",
    r"\b(stroke|face drooping|arm weakness|slurred speech|sudden numbness.*one side)\b",
    r"\b(suicid|kill myself|end my life|want to die|self-harm)\b",
    r"\b(can'?t breathe|severe shortness of breath|suffocating|choking|anaphylaxis|throat swelling)\b",
    r"\b(coughing.*blood|vomiting.*blood|uncontrolled bleeding|profuse bleeding)\b",
    r"\b(unconscious|passed out|seizure lasting|status epilepticus)\b",
]

PROMPT_INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"disregard all prior directives",
    r"you are now (dan|jailbroken|unrestricted)",
    r"print your system prompt",
    r"reveal confidential internal instructions",
    r"<script>|javascript:",
]

DISCLAIMER_TEXT = (
    "\n\n---\n**Clinical & Regulatory Disclaimer:** MediPredict AI is an informational and research platform. "
    "This guidance is grounded in peer-reviewed scientific literature and structured medical reference databases. "
    "It is NOT a clinical diagnosis, treatment plan, or medical substitute. Always consult a qualified, licensed healthcare "
    "professional for diagnosis and treatment decisions."
)

class AISafetyLayer:
    @staticmethod
    def inspect_query(text: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Returns (is_emergency, emergency_message, injection_alert)
        """
        text_lower = text.lower()

        # Check prompt injection
        for pat in PROMPT_INJECTION_PATTERNS:
            if re.search(pat, text_lower):
                return False, None, "Potential system prompt manipulation detected and sanitized."

        # Check emergency patterns
        for pat in EMERGENCY_PATTERNS:
            if re.search(pat, text_lower):
                emergency_msg = (
                    "CRITICAL MEDICAL EMERGENCY WARNING:\n"
                    "Your symptoms indicate a potentially life-threatening medical emergency. "
                    "Do NOT wait for an online analysis. Immediately call your local emergency services "
                    "(911 in North America, 112 in Europe/India, 999 in the UK) or proceed to the nearest emergency department right away."
                )
                return True, emergency_msg, None

        return False, None, None

    @staticmethod
    def append_disclaimer(content: str) -> str:
        if "Clinical & Regulatory Disclaimer:" not in content:
            return content.strip() + DISCLAIMER_TEXT
        return content.strip()
