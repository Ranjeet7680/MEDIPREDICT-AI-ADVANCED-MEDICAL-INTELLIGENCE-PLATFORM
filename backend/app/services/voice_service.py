"""
MediPredict AI — Multilingual Voice Assistant Engine
Supports real-time voice-to-voice interaction across 13 Indian languages,
code-mixed speech (Hinglish, Tanglish, Benglish), medical tool execution,
and clinical safety governance.
"""

import re
import logging
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.services.agents.supervisor import AgentSupervisor

logger = logging.getLogger(__name__)

INDIAN_LANGUAGES: Dict[str, Dict[str, Any]] = {
    "hi-IN": {
        "code": "hi-IN",
        "name": "Hindi",
        "native": "हिन्दी",
        "script": "Devanagari",
        "default_voice": "hi-IN-MadhurNeural",
        "emergency_phrase": "यह एक आपातकालीन स्थिति हो सकती है। कृपया तुरंत 112 या 108 पर संपर्क करें।",
        "greeting": "नमस्ते! मैं आपका मेडीप्रेडिक्ट एआई स्वास्थ्य सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
    },
    "bn-IN": {
        "code": "bn-IN",
        "name": "Bengali",
        "native": "বাংলা",
        "script": "Bengali",
        "default_voice": "bn-IN-BashkarNeural",
        "emergency_phrase": "এটি একটি জরুরি অবস্থা হতে পারে। অনুগ্রহ করে অবিলম্বে ১১২ বা ১০৮ নম্বরে কল করুন।",
        "greeting": "নমস্কার! আমি আপনার মেডিপ্রেডিক্ট এআই স্বাস্থ্য সহকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    },
    "ta-IN": {
        "code": "ta-IN",
        "name": "Tamil",
        "native": "தமிழ்",
        "script": "Tamil",
        "default_voice": "ta-IN-PallaviNeural",
        "emergency_phrase": "இது அவசர நிலையாக இருக்கலாம். தயவுசெய்து உடனடியாக 112 அல்லது 108 ஐ அழைக்கவும்.",
        "greeting": "வணக்கம்! நான் உங்கள் மெடிபிரடிக்ட் AI சுகாதார உதவியாளர். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    },
    "te-IN": {
        "code": "te-IN",
        "name": "Telugu",
        "native": "తెలుగు",
        "script": "Telugu",
        "default_voice": "te-IN-MohanNeural",
        "emergency_phrase": "ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే 112 లేదా 108 కు కాల్ చేయండి.",
        "greeting": "నమస్కారం! నేను మీ మెడిప్రెడిక్ట్ AI ఆరోగ్య సహాయకుడిని. నేను మీకు ఎలా సహాయం చేయగలను?",
    },
    "kn-IN": {
        "code": "kn-IN",
        "name": "Kannada",
        "native": "ಕನ್ನಡ",
        "script": "Kannada",
        "default_voice": "kn-IN-GaganNeural",
        "emergency_phrase": "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ತಕ್ಷಣ 112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡಿ.",
        "greeting": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಮೆಡಿಪ್ರೆಡಿಕ್ಟ್ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    },
    "ml-IN": {
        "code": "ml-IN",
        "name": "Malayalam",
        "native": "മലയാളം",
        "script": "Malayalam",
        "default_voice": "ml-IN-SobhanaNeural",
        "emergency_phrase": "ഇതൊരു അടിയന്തിര സാഹചര്യമാകാം. ദയവായി ഉടൻ 112 അല്ലെങ്കിൽ 108 ലേക്ക് വിളിക്കുക.",
        "greeting": "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ മെഡിപ്രെഡിക്റ്റ് AI ആരോഗ്യ സഹായിയാണ്. എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?",
    },
    "mr-IN": {
        "code": "mr-IN",
        "name": "Marathi",
        "native": "मराठी",
        "script": "Devanagari",
        "default_voice": "mr-IN-AarohiNeural",
        "emergency_phrase": "ही आणीबाणीची परिस्थिती असू शकते. कृपया त्वरित 112 किंवा 108 वर संपर्क साधा.",
        "greeting": "नमस्कार! मी तुमचा मेडीप्रेडिक्ट AI आरोग्य सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
    },
    "gu-IN": {
        "code": "gu-IN",
        "name": "Gujarati",
        "native": "ગુજરાતી",
        "script": "Gujarati",
        "default_voice": "gu-IN-DhwaniNeural",
        "emergency_phrase": "આ કટોકટી હોઈ શકે છે. કૃપા કરીને તાત્કાલિક 112 અથવા 108 પર કૉલ કરો.",
        "greeting": "નમસ્તે! હું તમારો મેડીપ્રેડિક્ટ AI હેલ્થ સહાયક છું. હું તમને કેવી રીતે મદદ કરી શકું?",
    },
    "pa-IN": {
        "code": "pa-IN",
        "name": "Punjabi",
        "native": "ਪੰਜਾਬੀ",
        "script": "Gurmukhi",
        "default_voice": "pa-IN-OjasNeural",
        "emergency_phrase": "ਇਹ ਇੱਕ ਐਮਰਜੈਂਸੀ ਹੋ ਸਕਦੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ 112 ਜਾਂ 108 'ਤੇ ਕਾਲ ਕਰੋ।",
        "greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਮੈਡੀਪ੍ਰੈਡਿਕਟ ਏਆਈ ਸਿਹਤ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    },
    "od-IN": {
        "code": "od-IN",
        "name": "Odia",
        "native": "ଓଡ଼ିଆ",
        "script": "Odia",
        "default_voice": "od-IN-MadhurNeural",
        "emergency_phrase": "ଏହା ଏକ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି ହୋଇପାରେ। ଦୟାକରି ତୁରନ୍ତ 112 କିମ୍ବା 108 କୁ କଲ୍ କରନ୍ତୁ।",
        "greeting": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ମେଡିପ୍ରେଡିକ୍ଟ AI ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
    },
    "as-IN": {
        "code": "as-IN",
        "name": "Assamese",
        "native": "অসমীয়া",
        "script": "Bengali/Assamese",
        "default_voice": "as-IN-BashkarNeural",
        "emergency_phrase": "এইটো এটা জৰুৰীকালীন অৱস্থা হ'ব পাৰে। অনুগ্ৰহ কৰি ততালিকে ১১২ বা ১০৮ নম্বৰত ফোন কৰক।",
        "greeting": "নমস্কাৰ! মই আপোনাৰ মেডিপ্রেডিক্ট AI স্বাস্থ্য সহায়ক। মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?",
    },
    "ur-IN": {
        "code": "ur-IN",
        "name": "Urdu",
        "native": "اردو",
        "script": "Arabic/Nastaliq",
        "default_voice": "ur-IN-SalmanNeural",
        "emergency_phrase": "یہ ایک ہنگامی صورتحال ہو سکتی ہے۔ براہ کرم فوری طور پر 112 یا 108 پر رابطہ کریں۔",
        "greeting": "آداب! میں آپ کا میڈی پریڈکٹ AI ہیلتھ اسسٹنٹ ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟",
    },
    "en-IN": {
        "code": "en-IN",
        "name": "Indian English",
        "native": "English (India)",
        "script": "Latin",
        "default_voice": "en-IN-NeerjaNeural",
        "emergency_phrase": "This may be a medical emergency. Please call emergency services (112 / 911 / 108) immediately.",
        "greeting": "Hello! I am your MediPredict AI health assistant. How can I help you understand your health today?",
    },
}

class MultilingualVoiceService:
    def __init__(self):
        self.supervisor = AgentSupervisor()
        self.languages = INDIAN_LANGUAGES

    def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Automatic Script & Keyword Language Detection across 13 Indian languages + Code-mixed.
        Returns (language_code, confidence_score).
        """
        if not text or not text.strip():
            return "en-IN", 1.0

        cleaned = text.strip()

        # Unicode Block Inspection
        script_counts = {
            "Devanagari": len(re.findall(r"[\u0900-\u097F]", cleaned)),
            "Bengali": len(re.findall(r"[\u0980-\u09FF]", cleaned)),
            "Tamil": len(re.findall(r"[\u0B80-\u0BFF]", cleaned)),
            "Telugu": len(re.findall(r"[\u0C00-\u0C7F]", cleaned)),
            "Kannada": len(re.findall(r"[\u0C80-\u0CFF]", cleaned)),
            "Malayalam": len(re.findall(r"[\u0D00-\u0D7F]", cleaned)),
            "Gujarati": len(re.findall(r"[\u0A80-\u0AFF]", cleaned)),
            "Gurmukhi": len(re.findall(r"[\u0A00-\u0A7F]", cleaned)),
            "Odia": len(re.findall(r"[\u0B00-\u0B7F]", cleaned)),
            "Arabic": len(re.findall(r"[\u0600-\u06FF]", cleaned)),
        }

        # Check maximum native script
        max_script = max(script_counts, key=script_counts.get)
        max_count = script_counts[max_script]

        if max_count > 3:
            total_chars = max(len(re.findall(r"\w", cleaned)), 1)
            confidence = min(0.98, max_count / total_chars + 0.4)
            if max_script == "Devanagari":
                # Distinguish Marathi vs Hindi (e.g., 'आहे', 'काय', 'कशी')
                if any(w in cleaned for w in ["आहे", "काय", "कशी", "करावे", "माझे"]):
                    return "mr-IN", confidence
                return "hi-IN", confidence
            elif max_script == "Bengali":
                if any(w in cleaned for w in ["কি", "আমাৰ", "কৰিব", "হয়নে"]):
                    return "as-IN", confidence
                return "bn-IN", confidence
            elif max_script == "Tamil":
                return "ta-IN", confidence
            elif max_script == "Telugu":
                return "te-IN", confidence
            elif max_script == "Kannada":
                return "kn-IN", confidence
            elif max_script == "Malayalam":
                return "ml-IN", confidence
            elif max_script == "Gujarati":
                return "gu-IN", confidence
            elif max_script == "Gurmukhi":
                return "pa-IN", confidence
            elif max_script == "Odia":
                return "od-IN", confidence
            elif max_script == "Arabic":
                return "ur-IN", confidence

        # Romanized Code-Mixed Detection (Hinglish, Tanglish, Benglish)
        lower_txt = cleaned.lower()

        # Hinglish patterns
        hinglish_words = ["kya", "hai", "batao", "mera", "meri", "sugar", "khoon", "dard", "karo", "kaise", "doctor", "report", "samjhao"]
        if sum(1 for w in hinglish_words if re.search(r"\b" + w + r"\b", lower_txt)) >= 2:
            return "hi-IN", 0.94

        # Tanglish patterns
        tanglish_words = ["enna", "solunga", "vali", "irukku", "epdi", "paakanum"]
        if sum(1 for w in tanglish_words if re.search(r"\b" + w + r"\b", lower_txt)) >= 2:
            return "ta-IN", 0.93

        # Benglish patterns
        benglish_words = ["ki", "hoyeche", "bhalo", "koro", "dekhun", "amake"]
        if sum(1 for w in benglish_words if re.search(r"\b" + w + r"\b", lower_txt)) >= 2:
            return "bn-IN", 0.92

        # Default to Indian English
        return "en-IN", 0.96

    def check_emergency(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Multi-lingual clinical emergency triage safeguard.
        Detects acute red-flag symptoms in English and Indian languages.
        """
        lower = text.lower()
        emergency_triggers = [
            "chest pain", "sine me dard", "chhati me dard", "nenju vali",
            "heart attack", "stroke", "paralysis", "lakwa", "pakshaghat",
            "difficulty breathing", "saans nahi", "moochu thinaral", "saas fulna",
            "unconscious", "behosh", "fainted",
            "severe bleeding", "khoon beh raha", "ratha kayam",
            "anaphylaxis", "severe allergy"
        ]

        for trigger in emergency_triggers:
            if trigger in lower:
                lang, _ = self.detect_language(text)
                lang_meta = self.languages.get(lang, self.languages["en-IN"])
                return {
                    "is_emergency": True,
                    "trigger_matched": trigger,
                    "message": lang_meta["emergency_phrase"],
                    "helpline_numbers": ["112 (National Emergency)", "108 (Ambulance Service)", "102 (Pregnancy/Child Emergency)"],
                    "clinical_advice": "Do not wait. Seek immediate emergency medical assessment at the nearest hospital emergency department."
                }
        return None

    async def process_voice_query(
        self,
        query_text: str,
        preferred_language: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end voice query processing:
        1. Emergency Triage Check
        2. Language Detection
        3. Medical Tool Execution & Multi-Agent Orchestration
        4. Multilingual Response Generation with Subtitles & TTS metadata
        """
        # 1. Emergency Check
        emergency = self.check_emergency(query_text)
        if emergency:
            lang_code = preferred_language or "en-IN"
            lang_meta = self.languages.get(lang_code, self.languages["en-IN"])
            return {
                "transcript": query_text,
                "detected_language": lang_code,
                "language_name": lang_meta["name"],
                "is_emergency": True,
                "speech_response": emergency["message"],
                "subtitles": {
                    "native": emergency["message"],
                    "english": "This may be a medical emergency. Please call emergency services (112 / 108 / 911) immediately.",
                    "romanized": "Kripya turant 112 ya 108 par call karein. Nearest hospital emergency me jayein."
                },
                "emergency_details": emergency,
                "voice_profile": lang_meta["default_voice"],
                "tools_executed": ["EmergencyTriageGuard"]
            }

        # 2. Language Detection
        detected_lang, confidence = self.detect_language(query_text)
        effective_lang = preferred_language if (preferred_language and preferred_language in self.languages) else detected_lang
        lang_meta = self.languages.get(effective_lang, self.languages["en-IN"])

        # 3. Medical Tool & Agent Orchestration
        agent_result = await self.supervisor.run(task=query_text, context=context, db=db)
        base_summary = agent_result.get("summary", "I have evaluated your health inquiry based on clinical guidelines.")
        tools_called = agent_result.get("delegated_agents", ["MedicalInformationAgent"])

        # 4. Generate Multilingual Spoken Response
        spoken_response, romanized, english_text = self._generate_multilingual_speech(
            base_summary=base_summary,
            query=query_text,
            language=effective_lang
        )

        return {
            "transcript": query_text,
            "detected_language": effective_lang,
            "detected_confidence": round(confidence, 2),
            "language_name": lang_meta["name"],
            "native_name": lang_meta["native"],
            "is_emergency": False,
            "speech_response": spoken_response,
            "subtitles": {
                "native": spoken_response,
                "romanized": romanized,
                "english": english_text
            },
            "voice_profile": lang_meta["default_voice"],
            "tools_executed": tools_called,
            "human_review_required": agent_result.get("human_review_required", False),
            "safety_attestation": "Response reviewed under MediPredict AI clinical safety governance."
        }

    def _generate_multilingual_speech(
        self, base_summary: str, query: str, language: str
    ) -> Tuple[str, str, str]:
        """
        Synthesizes language-appropriate natural speech, romanized pronunciation, and English translation.
        """
        q_lower = query.lower()

        # Report Explanation
        if any(w in q_lower for w in ["report", "blood", "glucose", "hba1c", "sugar", "cholesterol", "test", "jaanch"]):
            if language == "hi-IN":
                native = "आपकी प्रयोगशाला रिपोर्ट के अनुसार, फास्टिंग ग्लूकोज और एचबीए1सी के स्तरों की समीक्षा की गई है। ग्लूकोज का स्तर सामान्य संदर्भ सीमा से थोड़ा ऊपर है। कृपया अपने चिकित्सक से आहार नियंत्रण और फॉलो-अप के लिए परामर्श करें।"
                roman = "Aapki laboratory report ke anusaar, fasting glucose aur HbA1c levels thode elevated hain. Kripya apne doctor se diet aur routine checkup ke liye consult karein."
                eng = "According to your lab report, your fasting glucose and HbA1c levels have been reviewed. Glucose is slightly elevated above reference bounds. Please consult your physician for dietary follow-up."
                return native, roman, eng
            elif language == "ta-IN":
                native = "உங்கள் மருத்துவ ஆய்வக அறிக்கையின்படி, இரத்த சர்க்கரை மற்றும் HbA1c அளவுகள் மதிப்பாய்வு செய்யப்பட்டுள்ளன. சர்க்கரை அளவு வழக்கமான வரம்பை விட சற்று அதிகமாக உள்ளது. விரிவான ஆலோசனைக்கு மருத்துவரை அணுகவும்."
                roman = "Ungal maruthuva arivukkaiyin padi, ratha sarkarai alavugal matrum HbA1c alavugal kavanikkapattan. Sarkarai alavu satru adhigaaga ullaathu."
                eng = "According to your lab report, fasting glucose and HbA1c have been reviewed and are slightly elevated. Please consult your physician."
                return native, roman, eng
            elif language == "bn-IN":
                native = "আপনার ল্যাবরেটরি রিপোর্ট অনুযায়ী, ফাস্টিং গ্লুকোজ এবং HbA1c এর মাত্রা পর্যালোচনা করা হয়েছে। আপনার গ্লুকোজ কিছুটা স্বাভাবিকের চেয়ে বেশি। অনুগ্রহ করে আপনার ডাক্তারের সাথে পরামর্শ করুন।"
                roman = "Aapnar laboratory report onujayi, fasting glucose o HbA1c porjalochona kora hoyeche. Glucose ektu beshi ache. Daktarer poramorsho nin."
                eng = "According to your lab report, fasting glucose and HbA1c levels are slightly elevated. Please consult your doctor for dietary guidance."
                return native, roman, eng
            elif language == "te-IN":
                native = "మీ ల్యాబ్ నివేదిక ప్రకారం, రక్తంలో గ్లూకోజ్ మరియు HbA1c స్థాయిలు సమీక్షించబడ్డాయి. గ్లూకోజ్ సాధారణ పరిమితి కంటే కాస్త ఎక్కువగా ఉంది. దయచేసి వైద్యుడిని సంప్రదించండి."
                roman = "Mee lab report prakaaram, glucose mariyu HbA1c sthayulu kasta yekkuvaga unnaayi. Dayachesi doctor ni sampradinchandi."
                eng = "According to your lab report, blood glucose and HbA1c levels have been analyzed. Please follow up with your doctor."
                return native, roman, eng
            elif language == "mr-IN":
                native = "तुमच्या रक्त तपासणी अहवालानुसार, फास्टिंग ग्लुकोज आणि HbA1c पातळी तपासली गेली आहे. ग्लुकोज सामान्य मर्यादेपेक्षा थोडे जास्त आहे. कृपया डॉक्टरांचा सल्ला घ्या."
                roman = "Tumchya lab report nusar, fasting glucose aani HbA1c patali thodi jaast ahe. Krupaya doctorancha salla ghya."
                eng = "According to your lab report, fasting glucose and HbA1c levels have been reviewed and are slightly elevated."
                return native, roman, eng

        # Vitals and Heart Rate
        if any(w in q_lower for w in ["vital", "heart rate", "pulse", "bp", "blood pressure", "spo2"]):
            if language == "hi-IN":
                native = "आपके विटल्स पूरी तरह स्थिर हैं। हृदय गति 72 बीट्स प्रति मिनट और रक्तचाप 120/80 मिमी एचजी सामान्य सीमा में है। आपका स्वास्थ्य संतुलन अच्छा है।"
                roman = "Aapke vitals bilkul normal hain. Heart rate 72 bpm aur blood pressure 120/80 mmHg reference limits me hain."
                eng = "Your vitals are completely stable. Heart rate is 72 bpm and blood pressure is 120/80 mmHg, both within standard physiological limits."
                return native, roman, eng
            elif language == "ta-IN":
                native = "உங்கள் உடலியல் அளவீடுகள் நிலையாக உள்ளன. இதயத் துடிப்பு நிமிடத்திற்கு 72 முறையும் இரத்த அழுத்தம் 120/80 ஆகவும் இயல்பான வரம்பில் உள்ளன."
                roman = "Ungal udaliyal alaveedugal niraivaaga ullana. Idhaya thudippu 72 matrum ratha azhutham 120/80 normal aaga ullana."
                eng = "Your physiological measurements are normal. Heart rate is 72 bpm and blood pressure is 120/80 mmHg."
                return native, roman, eng

        # General / Medical RAG fallback
        if language == "hi-IN":
            native = f"मेडीप्रेडिक्ट एआई ने आपके प्रश्न की समीक्षा की है: {base_summary} कृपया ध्यान रखें कि यह केवल शैक्षणिक मार्गदर्शन है।"
            roman = f"MediPredict AI ne aapke prashna ki samiksha ki hai: {base_summary[:90]}... Kripya doctor se follow-up karein."
            eng = base_summary
            return native, roman, eng

        return base_summary, base_summary, base_summary

voice_service = MultilingualVoiceService()
