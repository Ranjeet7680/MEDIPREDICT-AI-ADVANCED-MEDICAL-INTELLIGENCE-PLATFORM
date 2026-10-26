"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Microscope,
  Paperclip,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CeliacRiskResponse,
  Conversation,
  MedicalReport,
  Message,
  ProviderStatus,
} from "@/types";

const SUGGESTED_PROMPTS = [
  "Explain celiac disease serology (tTG-IgA, total IgA, and Marsh stages).",
  "What do elevated transferrin saturation and ferritin indicate?",
  "Explain the difference between Fasting Glucose and HbA1c in diabetes.",
  "What is the clinical significance of HFE gene variants (C282Y / H63D)?",
];

export default function AssistantPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | undefined>(undefined);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("clinical_evidence");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // ML Risk Tool Modal
  const [showMlModal, setShowMlModal] = useState(false);
  const [mlData, setMlData] = useState({
    age: 26,
    gender: "Female",
    diabetes: "No",
    diabetes_type: "None",
    diarrhoea: "inflammatory",
    abdominal_pain: "yes",
    short_stature: "no",
    sticky_stool: "yes",
    weight_loss: "yes",
    iga: 2.8,
    igg: 13.9,
    igm: 1.1,
  });
  const [mlResult, setMlResult] = useState<CeliacRiskResponse | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [convs, provs, reps] = await Promise.all([
        api.listConversations(),
        api.getProviders(),
        api.listReports(),
      ]);
      setConversations(convs);
      setProviderStatus(provs);
      setReports(reps);

      if (convs.length > 0) {
        selectConversation(convs[0].id);
      } else {
        await startNewConversation();
      }
    } catch (err) {
      console.error("Assistant init error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (id: number) => {
    setActiveConvId(id);
    try {
      const detail = await api.getConversation(id);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error("Load conversation error:", err);
    }
  };

  const startNewConversation = async () => {
    try {
      const newConv = await api.createConversation("New Consultation");
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      const detail = await api.getConversation(newConv.id);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error("Create conversation error:", err);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeConvId || isSending) return;

    setInputText("");
    setIsSending(true);

    // Optimistic UI for user message
    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: activeConvId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const responseMsg = await api.sendMessage(
        activeConvId,
        text,
        selectedProvider,
        selectedReportId
      );
      setMessages((prev) => [...prev.slice(0, -1), tempUserMsg, responseMsg]);
      // Update title in sidebar
      api.listConversations().then(setConversations);
    } catch (err: any) {
      // Show error in chat
      const errorMsg: Message = {
        id: Date.now() + 1,
        conversation_id: activeConvId,
        role: "assistant",
        content: `Error generating response: ${err.message || "Failed to communicate with provider."}`,
        safety_alerts: ["Provider communication error."],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const toggleSpeakMessage = (id: number, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`\[\]()]/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportConversation = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleRunMlPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMlLoading(true);
    try {
      const res = await api.predictRisk(mlData);
      setMlResult(res);
    } catch (err) {
      console.error("ML error:", err);
    } finally {
      setMlLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        {/* Conversation Sidebar */}
        <aside className="w-64 border-r border-border bg-white dark:bg-[#1a2e38] flex flex-col shrink-0 hidden md:flex">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Consultations</span>
            <button
              onClick={startNewConversation}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                  activeConvId === c.id
                    ? "bg-surface-low dark:bg-surface-variant/30 text-primary font-semibold border border-primary/20"
                    : "text-foreground hover:bg-surface-low/50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-600 transition-opacity"
                  title="Delete consultation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* ML Risk Research Tool Banner */}
          <div className="p-3 m-2 rounded-xl border border-teal-200 bg-teal-50 dark:bg-teal-950/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1">
                <Microscope className="w-3.5 h-3.5 text-primary" /> ML Risk Model
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-200 dark:bg-teal-900 text-teal-900 font-bold">
                AUC 0.94
              </span>
            </div>
            <p className="text-[10px] text-teal-800/80 dark:text-teal-400">
              Interactive Celiac risk stratification calculator.
            </p>
            <button
              onClick={() => setShowMlModal(true)}
              className="w-full py-1 text-center font-semibold text-[11px] rounded bg-primary text-white hover:bg-primary-container transition-colors"
            >
              Open Research Model
            </button>
          </div>
        </aside>

        {/* Main Chat Workspace */}
        <main className="flex-1 flex flex-col bg-surface-low/20 overflow-hidden">
          {/* Top Assistant Status Bar */}
          <div className="px-4 py-2.5 border-b border-border bg-white dark:bg-[#1a2e38] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground leading-tight">
                  MediPredict Clinical Intelligence
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Evidence-Grounded • PubMed References • No Fabricated Citations
                </p>
              </div>
            </div>

            {/* Provider and Attachment Selectors */}
            <div className="flex items-center gap-2">
              {/* Real-time Voice Mode Launcher */}
              <Link
                href="/assistant/voice"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary-container text-white text-[11px] font-semibold hover:opacity-90 shadow-2xs hover:scale-105 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>🎙️ Real-Time Voice Mode</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full hidden md:inline">13 Indian Languages</span>
              </Link>
              {/* Attachment */}
              {reports.length > 0 && (
                <div className="flex items-center gap-1.5 bg-surface-low px-2.5 py-1 rounded-lg border border-border">
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                  <select
                    value={selectedReportId || ""}
                    onChange={(e) =>
                      setSelectedReportId(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="bg-transparent text-[11px] font-medium text-foreground focus:outline-none"
                  >
                    <option value="">Attach Lab Report (Optional)</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.measurement_count} tests)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Provider dropdown */}
              <div className="flex items-center gap-1.5 bg-surface-low px-2.5 py-1 rounded-lg border border-border">
                <Sparkles className="w-3 h-3 text-primary" />
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-transparent text-[11px] font-medium text-foreground focus:outline-none"
                >
                  <option value="clinical_evidence">
                    MediPredict Evidence Engine (Offline Grounded)
                  </option>
                  <option value="gemini">Google Gemini (Gen AI)</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="local">Local Endpoint</option>
                </select>
              </div>

              {/* Export / Print Conversation Button */}
              <button
                onClick={handleExportConversation}
                title="Export or Print Clinical Consultation"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-low text-[11px] font-semibold text-foreground hover:bg-surface-container transition-all"
              >
                <Printer className="w-3 h-3 text-muted-foreground" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    MediPredict AI Medical Assistant
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask questions about medical terms, lab measurements, or disease markers.
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="w-full space-y-2 pt-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Suggested Educational Inquiries
                  </span>
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className={`w-full p-2.5 text-xs text-left rounded-xl border border-border bg-white dark:bg-[#1a2e38] hover:bg-surface-low hover:border-primary/40 hover:translate-x-1 transition-all duration-200 text-foreground flex items-center justify-between smooth-button ${
                        idx < 5 ? `stagger-${idx + 1}` : ""
                      }`}
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <ArrowRight className="w-3 h-3 text-primary shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-3xl animate-fade-in-up ${isUser ? "ml-auto" : "mr-auto"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-4 text-xs space-y-3 shadow-xs ${
                        isUser
                          ? "bg-primary text-white rounded-tr-none ml-12"
                          : "bg-white dark:bg-[#1a2e38] border border-border text-foreground rounded-tl-none mr-12"
                      }`}
                    >
                      {/* Safety Alerts / Warning Banner */}
                      {m.safety_alerts && m.safety_alerts.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-900 dark:text-red-200 flex items-start gap-2 font-medium">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{m.safety_alerts.join(" • ")}</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="whitespace-pre-line leading-relaxed">{m.content}</div>

                      {/* Cited Sources Grounding */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-2 border-t border-border/60 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Peer-Reviewed Citations & Evidence
                          </p>
                          <div className="space-y-1">
                            {m.sources.map((src, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-surface-low/50 dark:bg-surface-variant/20 border border-border/50 text-[11px] flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-semibold text-foreground">{src.title}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {src.journal && `${src.journal} • `}
                                    {src.year && `${src.year} • `}
                                    {src.pmid && `PMID: ${src.pmid}`}
                                  </p>
                                </div>
                                {src.url && (
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 text-primary hover:underline flex items-center gap-1 text-[10px]"
                                  >
                                    <span>PubMed</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions for Assistant message */}
                      {!isUser && (
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-secondary" /> Grounded Evidence
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSpeakMessage(m.id, m.content)}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                              title="Text-to-speech audio readout"
                            >
                              {speakingId === m.id ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-primary animate-pulse" />
                                  <span className="text-primary font-bold">Stop Audio</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => copyToClipboard(m.content, m.id)}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              {copiedId === m.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center shrink-0 mt-0.5">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isSending && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Multi-Agent Supervisor synthesizing PubMed citations & guidelines...</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-border bg-white dark:bg-[#1a2e38]">
            {isListening && (
              <div className="flex items-center justify-center gap-1 py-1.5 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 font-semibold mb-2 animate-in fade-in max-w-4xl mx-auto">
                <span>Listening to your medical question...</span>
                <div className="flex items-center gap-0.5 ml-2 h-4">
                  <div className="w-1 bg-red-500 rounded-full animate-wave [animation-delay:0ms]"></div>
                  <div className="w-1 bg-red-500 rounded-full animate-wave [animation-delay:150ms]"></div>
                  <div className="w-1 bg-red-500 rounded-full animate-wave [animation-delay:300ms]"></div>
                  <div className="w-1 bg-red-500 rounded-full animate-wave [animation-delay:450ms]"></div>
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 max-w-4xl mx-auto"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about laboratory findings, symptoms, or medical literature..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? "Listening... click to stop recording" : "Voice dictation (Speech-to-Text)"}
                className={`smooth-button p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? "bg-red-500 text-white border-red-600 animate-pulse shadow-sm"
                    : "bg-surface-low border-border text-muted-foreground hover:text-foreground hover:bg-surface-container"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="smooth-button p-2.5 rounded-xl bg-primary text-white hover:bg-primary-container transition-all shadow-xs disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* ML Risk Model Calculator Modal */}
      {showMlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1a2e38] p-6 border border-border shadow-2xl space-y-4 my-8 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-primary" /> Celiac Disease Risk Stratification Model
                </h3>
                <p className="text-xs text-muted-foreground">
                  GradientBoostingClassifier trained on 2,206 clinical & serology records (ROC-AUC: 0.9424)
                </p>
              </div>
              <button
                onClick={() => setShowMlModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <SafetyNotice
              type="research_warning"
              message="This mathematical model provides statistical risk estimation based on training cohort distributions. It is NOT an endoscopic diagnosis."
            />

            <form onSubmit={handleRunMlPrediction} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={mlData.age}
                    onChange={(e) => setMlData({ ...mlData, age: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Gender</label>
                  <select
                    value={mlData.gender}
                    onChange={(e) => setMlData({ ...mlData, gender: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Diabetes Mellitus</label>
                  <select
                    value={mlData.diabetes}
                    onChange={(e) => setMlData({ ...mlData, diabetes: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes (Type 1 or 2)</option>
                  </select>
                </div>
              </div>

              {/* Lab Serology Inputs */}
              <div className="p-3 rounded-xl bg-surface-low/50 dark:bg-surface-variant/20 border border-border space-y-2">
                <span className="font-bold text-[11px] text-primary uppercase">
                  Immunoglobulin Serology Markers (g/L)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Serum IgA (Ref: 0.8 - 3.0 g/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={mlData.iga}
                      onChange={(e) => setMlData({ ...mlData, iga: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-[#1a2e38]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Serum IgG (Ref: 7.0 - 16.0 g/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={mlData.igg}
                      onChange={(e) => setMlData({ ...mlData, igg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-[#1a2e38]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Serum IgM (Ref: 0.4 - 2.3 g/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={mlData.igm}
                      onChange={(e) => setMlData({ ...mlData, igm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-[#1a2e38]"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Manifestations */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Diarrhea</label>
                  <select
                    value={mlData.diarrhoea}
                    onChange={(e) => setMlData({ ...mlData, diarrhoea: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="no">None</option>
                    <option value="inflammatory">Inflammatory</option>
                    <option value="fatty">Fatty / Steatorrhea</option>
                    <option value="watery">Watery</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Abdominal Pain</label>
                  <select
                    value={mlData.abdominal_pain}
                    onChange={(e) => setMlData({ ...mlData, abdominal_pain: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Weight Loss</label>
                  <select
                    value={mlData.weight_loss}
                    onChange={(e) => setMlData({ ...mlData, weight_loss: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Sticky Stool</label>
                  <select
                    value={mlData.sticky_stool}
                    onChange={(e) => setMlData({ ...mlData, sticky_stool: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={mlLoading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  {mlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
                  <span>Calculate Risk Score</span>
                </button>
              </div>
            </form>

            {/* Prediction Result Display */}
            {mlResult && (
              <div className="p-4 rounded-xl border border-border bg-surface-low/50 dark:bg-surface-variant/20 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Model Estimation Result
                    </span>
                    <h4 className="text-base font-bold text-foreground">
                      {mlResult.risk_level} ({(mlResult.estimated_risk_probability * 100).toFixed(1)}%)
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground">95% Confidence Interval:</span>
                    <p className="font-mono font-bold text-primary">
                      [{(mlResult.confidence_interval[0] * 100).toFixed(1)}% -{" "}
                      {(mlResult.confidence_interval[1] * 100).toFixed(1)}%]
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Key Contributing Factors:</span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                    {mlResult.contributing_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Clinical Recommendations:</span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                    {mlResult.recommended_clinical_followup.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
