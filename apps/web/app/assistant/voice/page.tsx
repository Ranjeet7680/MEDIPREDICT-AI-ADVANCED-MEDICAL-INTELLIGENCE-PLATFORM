"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Globe,
  Headphones,
  HeartPulse,
  HelpCircle,
  Languages,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sound } from "@/lib/sound";

interface LanguageItem {
  code: string;
  name: string;
  native: string;
  script: string;
  default_voice: string;
  greeting: string;
  emergency_phrase: string;
}

const DEFAULT_INDIAN_LANGUAGES: LanguageItem[] = [
  { code: "hi-IN", name: "Hindi", native: "हिन्दी", script: "Devanagari", default_voice: "hi-IN-MadhurNeural", greeting: "नमस्ते! मैं आपका मेडीप्रेडिक्ट एआई स्वास्थ्य सहायक हूँ।", emergency_phrase: "यह एक आपातकालीन स्थिति हो सकती है।" },
  { code: "bn-IN", name: "Bengali", native: "বাংলা", script: "Bengali", default_voice: "bn-IN-BashkarNeural", greeting: "নমস্কার! আমি আপনার মেডিপ্রেডিক্ট এআই স্বাস্থ্য সহকারী।", emergency_phrase: "এটি একটি জরুরি অবস্থা হতে পারে।" },
  { code: "ta-IN", name: "Tamil", native: "தமிழ்", script: "Tamil", default_voice: "ta-IN-PallaviNeural", greeting: "வணக்கம்! நான் உங்கள் மெடிபிரடிக்ட் AI சுகாதார உதவியாளர்.", emergency_phrase: "இது அவசர நிலையாக இருக்கலாம்." },
  { code: "te-IN", name: "Telugu", native: "తెలుగు", script: "Telugu", default_voice: "te-IN-MohanNeural", greeting: "నమస్కారం! నేను మీ మెడిప్రెడిక్ట్ AI ఆరోగ్య సహాయకుడిని.", emergency_phrase: "ఇది అత్యవసర పరిస్థితి కావచ్చు." },
  { code: "kn-IN", name: "Kannada", native: "ಕನ್ನಡ", script: "Kannada", default_voice: "kn-IN-GaganNeural", greeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಮೆಡಿಪ್ರೆಡಿಕ್ಟ್ AI ಆರೋಗ್ಯ ಸಹಾಯಕ.", emergency_phrase: "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು." },
  { code: "ml-IN", name: "Malayalam", native: "മലയാളം", script: "Malayalam", default_voice: "ml-IN-SobhanaNeural", greeting: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ മെഡിപ്രെഡിക്റ്റ് AI ആരോഗ്യ സഹായിയാണ്.", emergency_phrase: "ഇതൊരു അടിയന്തിര സാഹചര്യമാകാം." },
  { code: "mr-IN", name: "Marathi", native: "मराठी", script: "Devanagari", default_voice: "mr-IN-AarohiNeural", greeting: "नमस्कार! मी तुमचा मेडीप्रेडिक्ट AI आरोग्य सहाय्यक आहे.", emergency_phrase: "ही आणीबाणीची परिस्थिती असू शकते." },
  { code: "gu-IN", name: "Gujarati", native: "ગુજરાતી", script: "Gujarati", default_voice: "gu-IN-DhwaniNeural", greeting: "નમસ્તે! હું તમારો મેડીપ્રેડિક્ટ AI હેલ્થ સહાયક છું.", emergency_phrase: "આ કટોકटी હોઈ શકે છે." },
  { code: "pa-IN", name: "Punjabi", native: "ਪੰਜਾਬੀ", script: "Gurmukhi", default_voice: "pa-IN-OjasNeural", greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਮੈਡੀਪ੍ਰੈਡਿਕਟ ਏਆਈ ਸਿਹਤ ਸਹਾਇਕ ਹਾਂ.", emergency_phrase: "ਇਹ ਇੱਕ ਐਮਰਜੈਂਸੀ ਹੋ ਸਕਦੀ ਹੈ।" },
  { code: "od-IN", name: "Odia", native: "ଓଡ଼ିଆ", script: "Odia", default_voice: "od-IN-MadhurNeural", greeting: "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ମେଡିପ୍ରେଡିକ୍ଟ AI ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ।", emergency_phrase: "ଏହା ଏକ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି ହୋଇପାରେ।" },
  { code: "as-IN", name: "Assamese", native: "অসমীয়া", script: "Bengali", default_voice: "as-IN-BashkarNeural", greeting: "নমস্কাৰ! মই আপোনাৰ মেডিপ্রেডিক্ট AI স্বাস্থ্য সহায়ক।", emergency_phrase: "এইটো এটা জৰুৰীকালীন অৱস্থা হ'ব পাৰে।" },
  { code: "ur-IN", name: "Urdu", native: "اردو", script: "Arabic", default_voice: "ur-IN-SalmanNeural", greeting: "آداب! میں آپ کا میڈی پریڈکٹ AI ہیلتھ اسسٹنٹ ہوں۔", emergency_phrase: "یہ ایک ہنگامی صورتحال ہو سکتی ہے۔" },
  { code: "en-IN", name: "Indian English", native: "English (India)", script: "Latin", default_voice: "en-IN-NeerjaNeural", greeting: "Hello! I am your MediPredict AI voice assistant. Ask me anything about your health.", emergency_phrase: "This may be a medical emergency." },
];

const SUGGESTED_VOICE_PROMPTS = [
  { text: "मेरी हालिया ब्लड रिपोर्ट समझाओ", lang: "hi-IN", label: "Explain My Blood Report (Hindi)" },
  { text: "Mera blood pressure aur heart rate kaisa hai?", lang: "hi-IN", label: "Check Vitals Telemetry (Hinglish)" },
  { text: "Is Fasting Blood Glucose of 114 mg/dL pre-diabetic?", lang: "en-IN", label: "Glucose Range Query (English)" },
  { text: "எனது ஆய்வக அறிக்கையை விளக்குங்கள்", lang: "ta-IN", label: "Explain Report (Tamil)" },
  { text: "আমার রক্ত পরীক্ষার ফলাফল বলুন", lang: "bn-IN", label: "Explain Results (Bengali)" },
];

export default function VoiceAssistantPage() {
  const { user } = useAuth();
  const [selectedLang, setSelectedLang] = useState<string>("hi-IN");
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [subtitles, setSubtitles] = useState<{ native: string; romanized?: string; english?: string }>({
    native: "नमस्ते! बोलने के लिए नीचे दिए गए बटन पर टैप करें। (Tap below to start speaking)",
    romanized: "Namaste! Bolne ke liye neeche diye gaye button par tap karein.",
    english: "Hello! Tap the microphone or orb below to start talking.",
  });
  const [detectedBadge, setDetectedBadge] = useState<string>("हिन्दी (Hindi) &bull; Auto-Detect Active");
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  // Audio Context & Recognition references
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize Web Audio Analyzer for reactive visualizer
    const initVisualizer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
          const ctx = new AudioCtor();
          audioCtxRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          // Volume update loop
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioVolume(avg);
            }
            requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (err) {
        console.warn("Microphone visualizer initialization fallback:", err);
      }
    };

    initVisualizer();

    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Barge-In: Interrupt speech
  const handleInterrupt = () => {
    sound.playClick();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
  };

  // Start Speech Recognition
  const startListening = () => {
    sound.playClick();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRec();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = autoDetect ? "hi-IN" : selectedLang;

    recognition.onstart = () => {
      setVoiceState("listening");
      setInterimText("");
      setIsEmergency(false);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i][0];
        if (event.results[i].isFinal) {
          setTranscript(item.transcript);
          handleProcessVoiceQuery(item.transcript);
        } else {
          currentInterim += item.transcript;
        }
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setVoiceState("idle");
    };

    recognition.onend = () => {
      if (voiceState === "listening") {
        setVoiceState("idle");
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceState("idle");
    }
  };

  // Send to MediPredict AI Voice Backend
  const handleProcessVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setVoiceState("thinking");
    try {
      const response = await api.processVoiceQuery(
        queryText,
        autoDetect ? undefined : selectedLang
      );

      setTranscript(response.transcript);
      setDetectedBadge(`${response.language_name} &bull; ${Math.round(response.detected_confidence * 100)}% Confidence`);
      setActiveTools(response.tools_executed || []);
      setIsEmergency(response.is_emergency || false);
      setSubtitles(response.subtitles || { native: response.speech_response });

      // Speak response using SpeechSynthesis or Audio fallback
      speakText(response.speech_response, response.detected_language);
    } catch (err) {
      console.error("Voice process error:", err);
      setVoiceState("idle");
    }
  };

  // Multilingual Speech Synthesis (TTS)
  const speakText = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthRef.current = utterance;
    utterance.lang = langCode || "hi-IN";
    utterance.rate = speechRate;

    // Pick best matching Indian regional voice
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => {
      setVoiceState("speaking");
    };

    utterance.onend = () => {
      setVoiceState("idle");
    };

    utterance.onerror = () => {
      setVoiceState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSelectSuggestedPrompt = (p: typeof SUGGESTED_VOICE_PROMPTS[0]) => {
    sound.playClick();
    setSelectedLang(p.lang);
    setTranscript(p.text);
    handleProcessVoiceQuery(p.text);
  };

  const currentLangMeta =
    DEFAULT_INDIAN_LANGUAGES.find((l) => l.code === selectedLang) || DEFAULT_INDIAN_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground transition-colors duration-200">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full relative">
          {/* Top Bar: Back to Chat + Language Badge + Controls */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
            <Link
              href="/assistant"
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-surface-low"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Text Assistant</span>
            </Link>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowLangMenu(!showLangMenu);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white dark:bg-[#162732] text-xs font-semibold hover:border-primary transition-all shadow-2xs"
              >
                <Languages className="w-3.5 h-3.5 text-primary" />
                <span>{autoDetect ? `Auto (${currentLangMeta.native})` : currentLangMeta.native}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {showLangMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#162732] shadow-2xl border border-border p-3 z-50 animate-in fade-in"
                  onMouseLeave={() => setShowLangMenu(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-2 text-xs font-bold text-foreground">
                    <span>13 Indian Languages</span>
                    <button
                      onClick={() => setAutoDetect(!autoDetect)}
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        autoDetect ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground"
                      }`}
                    >
                      {autoDetect ? "Auto: ON" : "Auto: OFF"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                    {DEFAULT_INDIAN_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          sound.playClick();
                          setSelectedLang(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`p-2 rounded-xl text-left text-xs transition-colors ${
                          selectedLang === l.code
                            ? "bg-primary/10 text-primary font-bold border border-primary/20"
                            : "hover:bg-surface-low text-foreground"
                        }`}
                      >
                        <p className="font-semibold">{l.native}</p>
                        <p className="text-[10px] text-muted-foreground">{l.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Speed Rate Toggles */}
            <div className="flex items-center gap-1 bg-surface-low dark:bg-[#111d24] p-1 rounded-lg border border-border text-[11px] font-mono">
              {[0.8, 1.0, 1.2].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    sound.playClick();
                    setSpeechRate(r);
                  }}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    speechRate === r ? "bg-white dark:bg-[#1c303d] text-primary shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Alert Banner */}
          {isEmergency && (
            <div className="p-4 my-2 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm uppercase tracking-wide">
                  Emergency Clinical Red-Flag Detected
                </p>
                <p className="leading-relaxed">
                  The symptoms you reported may require urgent medical care. Call national emergency services immediately:
                  <span className="font-bold ml-1">112 / 108 / 102</span> or proceed to the nearest hospital emergency room.
                </p>
              </div>
            </div>
          )}

          {/* Central ChatGPT-Style Fluid Voice Orb Section */}
          <div className="flex flex-col items-center justify-center my-auto py-8 space-y-6">
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-low dark:bg-[#162732] border border-border text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  voiceState === "listening"
                    ? "bg-emerald-500 animate-ping"
                    : voiceState === "speaking"
                    ? "bg-cyan-500 animate-pulse"
                    : voiceState === "thinking"
                    ? "bg-amber-500 animate-spin"
                    : "bg-primary"
                }`}
              />
              <span className="capitalize font-semibold text-foreground">
                {voiceState === "listening"
                  ? "Listening (Speak in any Indian Language)..."
                  : voiceState === "speaking"
                  ? "Speaking (Tap Orb to Interrupt / Barge-In)"
                  : voiceState === "thinking"
                  ? "Analyzing Clinical Knowledge & Tools..."
                  : "Ready to Listen"}
              </span>
            </div>

            {/* Dynamic Interactive Pulsing Voice Orb */}
            <div
              onClick={() => {
                if (voiceState === "speaking") {
                  handleInterrupt();
                } else if (voiceState === "listening") {
                  setVoiceState("idle");
                } else {
                  startListening();
                }
              }}
              className="relative cursor-pointer group flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64"
            >
              {/* Outer Amplitude Ripple Rings */}
              <div
                className={`absolute inset-0 rounded-full transition-transform duration-300 ease-out ${
                  voiceState === "listening"
                    ? "bg-emerald-500/25 animate-ping opacity-60"
                    : voiceState === "speaking"
                    ? "bg-cyan-500/20 animate-pulse"
                    : "bg-primary/10 group-hover:scale-105"
                }`}
                style={{
                  transform: voiceState === "listening" ? `scale(${1 + audioVolume / 70})` : undefined,
                }}
              />

              {/* Second Ambient Sound Wave Ring */}
              <div
                className={`absolute -inset-3 rounded-full transition-all duration-500 ${
                  voiceState === "listening"
                    ? "border border-emerald-400/40 animate-pulse"
                    : voiceState === "speaking"
                    ? "border border-cyan-400/30 animate-pulse-slow"
                    : "opacity-0"
                }`}
              />

              <div
                className={`absolute inset-4 rounded-full transition-all duration-300 ${
                  voiceState === "listening"
                    ? "bg-emerald-500/30 blur-md"
                    : voiceState === "speaking"
                    ? "bg-teal-400/40 blur-md"
                    : "bg-primary/20 blur-sm group-hover:blur-md"
                }`}
              />

              {/* Central Glowing Radial Orb */}
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 relative z-10 ${
                  voiceState === "listening"
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] scale-105"
                    : voiceState === "speaking"
                    ? "bg-gradient-to-tr from-cyan-600 to-primary shadow-[0_0_50px_rgba(0,180,216,0.5)] scale-100"
                    : voiceState === "thinking"
                    ? "bg-gradient-to-tr from-indigo-600 to-purple-500 animate-pulse shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                    : "bg-gradient-to-tr from-primary to-primary-container group-hover:scale-105 shadow-xl"
                }`}
              >
                {voiceState === "speaking" ? (
                  <div className="flex items-center gap-1.5 h-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-white transition-all duration-200"
                        style={{
                          height: `${14 + (i % 3) * 10}px`,
                          animation: `wave-bar 1s ease-in-out infinite alternate`,
                          animationDelay: `${i * 140}ms`,
                        }}
                      />
                    ))}
                  </div>
                ) : voiceState === "thinking" ? (
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                ) : (
                  <Mic className={`w-12 h-12 transition-transform duration-200 ${voiceState === "listening" ? "scale-110 text-white" : "group-hover:scale-110"}`} />
                )}

                <span className="text-[11px] font-bold mt-2 text-white/90 uppercase tracking-wider">
                  {voiceState === "speaking" ? "Barge-In" : voiceState === "listening" ? "Listening" : "Tap to Speak"}
                </span>
              </div>
            </div>

            {/* Language & Voice Confidence Badge */}
            <div className="text-center space-y-1">
              <span
                dangerouslySetInnerHTML={{ __html: detectedBadge }}
                className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 inline-block font-mono"
              />
              {interimText && (
                <p className="text-xs text-muted-foreground animate-pulse max-w-md mx-auto truncate">
                  &ldquo;{interimText}...&rdquo;
                </p>
              )}
            </div>

            {/* Live Subtitles & Dual-Script Transcript Display */}
            <div className="w-full max-w-2xl p-5 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs space-y-2 text-center transition-colors duration-200">
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Live Multilingual Subtitles</span>
              </div>

              {/* Native Script (Devanagari, Tamil, Bengali, etc.) */}
              <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                {subtitles.native}
              </p>

              {/* Romanized Transliteration */}
              {subtitles.romanized && (
                <p className="text-xs sm:text-sm text-primary font-medium italic">
                  {subtitles.romanized}
                </p>
              )}

              {/* English Translation */}
              {subtitles.english && subtitles.english !== subtitles.native && (
                <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <span className="font-semibold text-foreground/80">English:</span> {subtitles.english}
                </p>
              )}
            </div>

            {/* Active Medical Tool Calling Badges */}
            {activeTools.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Healthcare Tools Executed:</span>
                {activeTools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-[11px] flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{tool}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Bar: Suggested Medical Voice Queries */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
              Suggested Indian-Language Health Queries
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_VOICE_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => handleSelectSuggestedPrompt(p)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white dark:bg-[#162732] hover:border-primary text-xs text-foreground font-medium transition-all shadow-2xs hover:scale-105"
                >
                  <span className="font-semibold text-primary mr-1">🎙️</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
