import React, { useState, useEffect, useRef } from "react";
import PmiLocator from "./components/PmiLocator";
import HeroCard from "./components/HeroCard";
import PrivacyNotice from "./components/PrivacyNotice";
import {
  allQuizAnswersSafe,
  buildChatFallback,
  buildQuizSummary,
  MEDICAL_DISCLAIMER,
  OFFLINE_NOTICE,
} from "../shared/content";

// --- Custom Simple Markdown Parser for beautiful styled responses ---
function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    let cleanLine = line.trim();
    
    // Header 3
    if (cleanLine.startsWith("###")) {
      return (
        <h3 key={lineIdx} className="text-lg font-bold text-slate-800 mt-4 mb-2 first:mt-0 flex items-center gap-2">
          {renderStyledText(cleanLine.replace("###", "").trim())}
        </h3>
      );
    }
    // Header 2
    if (cleanLine.startsWith("##")) {
      return (
        <h2 key={lineIdx} className="text-xl font-extrabold text-red-600 mt-5 mb-2 first:mt-0">
          {renderStyledText(cleanLine.replace("##", "").trim())}
        </h2>
      );
    }
    // Header 1
    if (cleanLine.startsWith("#")) {
      return (
        <h1 key={lineIdx} className="text-2xl font-black text-red-700 mt-6 mb-3 first:mt-0">
          {renderStyledText(cleanLine.replace("#", "").trim())}
        </h1>
      );
    }
    // Listed Items
    // A bullet needs whitespace after the marker; a line starting with **bold** is a paragraph.
    if (/^[*-]\s/.test(cleanLine)) {
      const content = cleanLine.substring(1).trim();
      return (
        <li key={lineIdx} className="list-disc list-inside ml-4 text-slate-700 my-1.5 leading-relaxed">
          {renderStyledText(content)}
        </li>
      );
    }
    // Numbered Items
    if (/^\d+\./.test(cleanLine)) {
      const match = cleanLine.match(/^(\d+)\.(.*)/);
      if (match) {
        return (
          <li key={lineIdx} className="list-decimal list-inside ml-4 text-slate-700 my-1.5 leading-relaxed">
            {renderStyledText(match[2].trim())}
          </li>
        );
      }
    }
    // Empty Line
    if (cleanLine === "") {
      return <div key={lineIdx} className="h-2" />;
    }
    // Normal Paragraph
    return (
      <p key={lineIdx} className="text-slate-600 leading-relaxed my-2">
        {renderStyledText(cleanLine)}
      </p>
    );
  });
}

// Inline Bold parsing (**bold**)
function renderStyledText(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} className="font-bold text-slate-900 bg-red-50/80 px-1 rounded">{part}</strong>;
    }
    return part;
  });
}

type ChatMessage = {
  role: "user" | "model";
  text: string;
  /** ai = live model answer; fallback = automatic reply; error = system notice (e.g. rate limit). */
  source?: "ai" | "fallback" | "error";
};

// Must stay within the limits enforced by server/validation.ts.
const CHAT_HISTORY_MAX_ITEMS = 10;
const CHAT_HISTORY_ITEM_MAX_CHARS = 2000;
const CHAT_MESSAGE_MAX_CHARS = 500;
const VISITOR_NAME_MAX_CHARS = 50;

export default function App() {
  // Navigation / Interactive Education Cards state
  const [activeEducationTab, setActiveEducationTab] = useState<string>("kesehatan");
  
  // App Name context
  const [visitorName, setVisitorName] = useState<string>("");
  const [hasEnteredName, setHasEnteredName] = useState<boolean>(false);

  // Quiz State
  const [quizStep, setQuizStep] = useState<number>(0);
  const [answers, setAnswers] = useState({
    ageWeight: "" as "safe" | "unsafe" | "",
    sleep: "" as "safe" | "unsafe" | "",
    meds: "" as "safe" | "unsafe" | "",
    recency: "" as "safe" | "unsafe" | ""
  });
  const [quizResult, setQuizResult] = useState<string>("");
  // Where the explanation came from: live AI or the built-in automatic summary.
  const [quizSource, setQuizSource] = useState<"ai" | "fallback">("fallback");
  const [quizNotice, setQuizNotice] = useState<string>("");
  const [isQuizEvaluating, setIsQuizEvaluating] = useState<boolean>(false);

  // Chatbot State
  const [chatOpened, setChatOpened] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Halo Kak! 😎 Aku **Sobat Hero AI**. Tanya aja hal umum soal donor darah. Jawabanku bisa keliru dan bukan nasihat medis; untuk syarat resmi, tanya PMI ya."
    }
  ]);
  // Honest connection state: unknown until the first reply tells us where it came from.
  const [aiStatus, setAiStatus] = useState<"unknown" | "ai" | "fallback">("unknown");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, chatOpened]);

  // Handle Quiz Step Progression
  const answerQuizQuestion = (questionKey: "ageWeight" | "sleep" | "meds" | "recency", val: "safe" | "unsafe") => {
    const updatedAnswers = { ...answers, [questionKey]: val };
    setAnswers(updatedAnswers);
    
    if (quizStep < 4) {
      setQuizStep(quizStep + 1);
    }
  };

  // Ask the server for an explanation of the quiz summary. Falls back to the built-in summary.
  const evaluateEligibility = async (finalAnswers: typeof answers) => {
    setIsQuizEvaluating(true);
    setQuizResult("");
    setQuizNotice("");
    const name = visitorName.trim() || undefined;
    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...finalAnswers }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success && typeof data.text === "string") {
        setQuizResult(data.text);
        setQuizSource(data.source === "ai" ? "ai" : "fallback");
        if (data.source !== "ai") setQuizNotice(OFFLINE_NOTICE);
      } else {
        throw new Error(data?.code || `http_${response.status}`);
      }
    } catch (err) {
      console.warn("Quiz explanation unavailable, using built-in summary.");
      setQuizResult(buildQuizSummary(name, finalAnswers));
      setQuizSource("fallback");
      setQuizNotice(OFFLINE_NOTICE);
    } finally {
      setIsQuizEvaluating(false);
    }
  };

  const finishQuiz = async (recency: "safe" | "unsafe") => {
    if (isQuizEvaluating) return;
    const finalAnswers = { ...answers, recency };
    setAnswers(finalAnswers);
    setQuizStep(5);
    await evaluateEligibility(finalAnswers);
  };

  // Send message to the chat assistant
  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || isChatSending) return;

    const userMsg: ChatMessage = { role: "user", text: msg };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          // The API bounds history size; send only recent live turns, each capped in length.
          history: chatHistory
            .filter((h) => h.source !== "error" && h.source !== "fallback")
            .slice(-CHAT_HISTORY_MAX_ITEMS)
            .map((h) => ({ role: h.role, text: h.text.slice(0, CHAT_HISTORY_ITEM_MAX_CHARS) })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success && typeof data.text === "string") {
        const source = data.source === "ai" ? "ai" : "fallback";
        setAiStatus(source);
        setChatHistory((prev) => [...prev, { role: "model", text: data.text, source }]);
      } else if (data?.code === "rate_limited" || data?.code === "invalid_request" || data?.code === "payload_too_large") {
        // The server refused this request: tell the user why instead of faking an answer.
        setChatHistory((prev) => [...prev, { role: "model", text: String(data.error || "Permintaan ditolak."), source: "error" }]);
      } else {
        throw new Error(data?.code || `http_${response.status}`);
      }
    } catch (err) {
      console.warn("Chat AI unavailable, using automatic reply.");
      setAiStatus("fallback");
      setChatHistory((prev) => [...prev, { role: "model", text: buildChatFallback(msg), source: "fallback" }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Reset Quiz to retake
  const resetQuiz = () => {
    setQuizStep(hasEnteredName ? 1 : 0);
    setAnswers({
      ageWeight: "",
      sleep: "",
      meds: "",
      recency: ""
    });
    setQuizResult("");
    setQuizNotice("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-red-500 selection:text-white transition-all duration-300">
      
      {/* HEADER SECTION - Eye-Catching & Pulsing Glow */}
      <header className="relative overflow-hidden bg-gradient-to-b from-red-600 to-red-500 text-white pt-10 pb-16 px-4 md:px-8 shadow-md">
        {/* Abstract Background Visuals */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-3xl -mr-10 -mt-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/5 rounded-full filter blur-2xl -ml-10 -mb-10" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Logo & Headline */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-red-100 mb-4 border border-white/20">
              <span className="w-2.5 h-2.5 bg-red-300 rounded-full animate-heartbeat" />
              #AyoDonor · Edukasi Donor Darah
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-3">
              Ayo<span className="text-red-200">Donor</span> 🩸
            </h1>
            
            <p className="text-lg md:text-2xl font-light text-red-100 max-w-xl leading-relaxed mb-6">
              "AI bisa bikin segalanya, tapi belum bisa bikin setetes darah." 
              Kenapa 1 kantong darahmu bisa bikin kamu jadi <strong className="font-bold text-white underline decoration-red-300 decoration-wavy">Real-Life Hero</strong>?
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a 
                href="#education" 
                className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-red-50 hover:shadow-lg active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600"
              >
                Pelajari Dasar-dasarnya 💡
              </a>
              <a 
                href="#quiz-section" 
                className="bg-red-700/40 text-white border border-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-700/60 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600"
              >
                Coba Kuis Panduan Awal 🔍
              </a>
            </div>
          </div>

          {/* Pulsing Avatar Mascot Container */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl relative w-full max-w-sm">
            <div className="relative">
              {/* Outer wave ripples */}
              <div className="absolute inset-0 bg-red-400 rounded-full filter blur-md animate-ping opacity-25" />
              
              {/* Cute Blood Mascot SVG */}
              <svg className="w-28 h-28 text-white relative z-10 animate-heartbeat" viewBox="0 0 100 120" fill="currentColor">
                <path d="M50 10 C50 10 90 55 90 80 A40 40 0 0 1 10 80 C10 55 50 10 50 10 Z" fill="#ffffff" />
                {/* Cute Smiling Face on Blood Drop */}
                <circle cx="38" cy="72" r="5" fill="#e11d48" />
                <circle cx="62" cy="72" r="5" fill="#e11d48" />
                <path d="M 44 82 Q 50 88 56 82" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Cheeks */}
                <ellipse cx="30" cy="76" rx="4" ry="2" fill="#fda4af" opacity="0.8" />
                <ellipse cx="70" cy="76" rx="4" ry="2" fill="#fda4af" opacity="0.8" />
              </svg>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-xl font-extrabold text-white">Droppy, AyoDonor Buddy</div>
              <p className="text-xs text-red-200 mt-1">Teman belajar soal donor darah. Bukan petugas medis dan tidak berafiliasi dengan PMI.</p>
            </div>

            <div className="mt-3 bg-red-800/60 text-red-100 text-[11px] font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              🩸 PROYEK EDUKASI INDEPENDEN
            </div>
          </div>

        </div>

        {/* Waves divider for visual smoothness */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-50" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0, 50% 100%, 0 0)" }} />
      </header>

      {/* DETAILED STATS BANNER */}
      <section className="-mt-6 px-4 max-w-6xl mx-auto w-full z-20">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border border-slate-100">
          <div className="flex items-center gap-4 py-2 sm:py-0 justify-center sm:justify-start">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">Hingga 3 Nyawa</div>
              <div className="text-xs text-slate-500 font-medium">per kantong darah (perkiraan yang dikutip Kemenkes)</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 sm:py-0 justify-center sm:pl-6 pl-0">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">Beberapa Komponen</div>
              <div className="text-xs text-slate-500 font-medium">Satu kantong bisa dipisah untuk pasien berbeda</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 sm:py-0 justify-center sm:pl-6 pl-0">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">Diperiksa Petugas</div>
              <div className="text-xs text-slate-500 font-medium">Hb, tekanan darah, dan riwayat kesehatan dicek sebelum donor</div>
            </div>
          </div>
        </div>
      </section>

      {/* PMI LOCATOR SECTION */}
      <div id="pmi-locator-container">
        <p className="max-w-6xl mx-auto w-full px-4 pt-6 text-center text-xs text-slate-500 leading-relaxed">
          Bagian lokasi di bawah memakai data contoh yang belum diverifikasi. Untuk lokasi dan stok darah resmi, buka ayodonor.pmi.or.id atau hubungi PMI terdekat.
        </p>
        <PmiLocator />
      </div>

      {/* SECTION 1: DASHBOARD MANFAAT MULTI-DIMENSI (Interactive Grid) */}
      <main id="education" className="max-w-6xl mx-auto w-full px-4 py-12 flex-grow">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Dasar-dasar Donor Darah 💡
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto mt-2 text-sm">
            Pelajari apa yang terjadi setelah donor, kenapa darah donor dibutuhkan, dan apa saja yang diperiksa petugas sebelum donor.
          </p>
        </div>

        {/* Tab Buttons for interactive detail view */}
        <div className="flex justify-center p-1 bg-slate-200/60 rounded-2xl max-w-lg mx-auto mb-8 relative z-10 border border-slate-200">
          <button 
            id="tab-kesehatan"
            onClick={() => setActiveEducationTab("kesehatan")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all duration-350 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
              activeEducationTab === "kesehatan" 
                ? "bg-white text-red-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            }`}
          >
            🔄 Setelah Donor
          </button>
          <button 
            id="tab-sosial"
            onClick={() => setActiveEducationTab("sosial")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all duration-350 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
              activeEducationTab === "sosial" 
                ? "bg-white text-red-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            }`}
          >
            🩸 Kenapa Dibutuhkan
          </button>
          <button 
            id="tab-personal"
            onClick={() => setActiveEducationTab("personal")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all duration-350 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
              activeEducationTab === "personal" 
                ? "bg-white text-red-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            }`}
          >
            🩺 Sebelum Donor
          </button>
        </div>

        {/* TAB 1: SETELAH DONOR */}
        {activeEducationTab === "kesehatan" && (
          <div id="content-kesehatan" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl" aria-hidden="true">
                🔄
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                Tubuh Mengganti Darah yang Didonorkan
              </h3>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Saat donor, sebagian darahmu diambil. Standar pelayanan transfusi darah menyebut kantong donor berisi sekitar <strong className="text-slate-900">350 mL atau 450 mL</strong>. Setelah itu tubuh mengganti darah yang diambil. Menurut FAQ PMI, sel darah merah pengganti terbentuk dalam sekitar 4-8 minggu.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500" aria-hidden="true">✔</span>
                    <span><strong>Ada jeda antar donor.</strong> Permenkes 91/2015 menyebut minimal 2 bulan antar donor darah lengkap agar tubuh sempat pulih. Sumber lain menyebut 3 bulan, jadi petugas PMI yang memastikan jedamu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500" aria-hidden="true">✔</span>
                    <span><strong>Ada pemeriksaan dulu.</strong> Hemoglobin, tekanan darah, dan riwayat kesehatanmu dinilai sebelum donor demi keselamatan pendonor dan penerima.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500" aria-hidden="true">✔</span>
                    <span><strong>Tanpa janji manfaat pribadi.</strong> AyoDonor tidak mengklaim donor menurunkan kolesterol, mempercantik kulit, atau menambah stamina. Alasan utama donor adalah membantu pasien.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-100/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-red-100 text-center">
              <span className="text-6xl" aria-hidden="true">🩸</span>
              <div className="bg-white/80 p-4 rounded-xl shadow-sm max-w-sm border border-slate-100 mt-4">
                <div className="text-sm font-bold text-slate-800">Informasi umum</div>
                <p className="text-xs text-slate-500 mt-1">Bukan nasihat medis pribadi. Sumber: Permenkes 91/2015 dan FAQ PMI (ayodonor.pmi.or.id).</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KENAPA DIBUTUHKAN */}
        {activeEducationTab === "sosial" && (
          <div id="content-sosial" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl" aria-hidden="true">
                🩸
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                Satu Kantong, Beberapa Komponen
              </h3>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Darah donor biasanya dipisah di unit transfusi darah menjadi beberapa komponen, yang diberikan ke pasien berbeda sesuai kebutuhan medisnya. Kemenkes pernah menyebut satu kantong dapat membantu hingga 3 nyawa.
                </p>

                <div className="grid grid-cols-1 gap-3 my-4">
                  <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <span className="text-xl" aria-hidden="true">🎒</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">Sel darah merah (PRC)</strong>
                      <span className="text-xs text-slate-600">Untuk pasien yang kehilangan banyak darah atau mengalami anemia berat.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-yellow-50/80 p-3 rounded-xl border border-yellow-100">
                    <span className="text-xl" aria-hidden="true">🥛</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">Plasma (FFP)</strong>
                      <span className="text-xs text-slate-600">Untuk pasien dengan gangguan pembekuan darah atau kebutuhan plasma tertentu.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <span className="text-xl" aria-hidden="true">🧪</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">Trombosit (TC)</strong>
                      <span className="text-xs text-slate-600">Untuk pasien dengan jumlah trombosit sangat rendah.</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Contoh umum. Keputusan transfusi selalu dibuat oleh dokter.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
              <div className="text-center font-mono text-xs text-red-700 font-semibold uppercase tracking-wider">
                Berapa banyak darah yang diambil?
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Standar pelayanan transfusi darah menyebut kantong donor berisi sekitar 350 mL atau 450 mL. Batas berat badan pendonor bergantung pada volume yang diambil, dan petugas PMI yang menentukan.
              </p>
              <p className="text-xs text-slate-500">Sumber: Permenkes 91/2015, Lampiran (standar seleksi donor).</p>
            </div>
          </div>
        )}

        {/* TAB 3: SEBELUM DONOR */}
        {activeEducationTab === "personal" && (
          <div id="content-personal" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl" aria-hidden="true">
                🩺
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                Apa yang Terjadi Sebelum Darahmu Diambil?
              </h3>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Sebelum donor, petugas menilai apakah kamu cukup sehat untuk donor dan mencatat faktor risiko. Tujuannya melindungi pendonor sekaligus penerima darah.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1" aria-hidden="true">🩸</span>
                    <strong className="text-slate-800 text-xs block">Hemoglobin (Hb)</strong>
                    <span className="text-[11px] text-slate-600">Dicek untuk memastikan kadar hemoglobinmu memadai.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1" aria-hidden="true">💓</span>
                    <strong className="text-slate-800 text-xs block">Tekanan darah & nadi</strong>
                    <span className="text-[11px] text-slate-600">Diukur sebelum donor.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1" aria-hidden="true">📋</span>
                    <strong className="text-slate-800 text-xs block">Riwayat kesehatan</strong>
                    <span className="text-[11px] text-slate-600">Petugas menanyakan penyakit, obat, dan faktor risiko. Jawablah dengan jujur.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1" aria-hidden="true">🧪</span>
                    <strong className="text-slate-800 text-xs block">Skrining darah donor</strong>
                    <span className="text-[11px] text-slate-600">Setiap kantong diperiksa untuk HIV, hepatitis B, hepatitis C, dan sifilis demi keamanan penerima.</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Skrining ini untuk keamanan darah yang diberikan ke pasien. Itu bukan pengganti pemeriksaan kesehatan pribadi. Jika ada hasil yang reaktif, petugas menyampaikannya lewat konseling.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-700 shadow-2xl min-h-[300px]">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-red-500/20 text-red-200 border border-red-500/40 text-[10px] font-mono py-1 px-3 rounded-full uppercase">
                    Referensi umum
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-3">
                    <span className="text-sm font-semibold text-slate-300">Hemoglobin (Hb)</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm text-right">umumnya 12,5 - 17 g/dL</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-3">
                    <span className="text-sm font-semibold text-slate-300">Tekanan darah & nadi</span>
                    <span className="text-xs text-slate-300 text-right">diukur, rentang dinilai petugas</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-3">
                    <span className="text-sm font-semibold text-slate-300">Berat badan</span>
                    <span className="text-xs text-slate-300 text-right">ada batas minimal, bergantung volume donor</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-300">Suhu tubuh</span>
                    <span className="text-xs text-slate-300 text-right">diperiksa petugas</span>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-[11px] text-slate-300 leading-relaxed">
                Sumber: Permenkes 91/2015 (Lampiran) dan FAQ PMI. Angka dapat berbeda antar sumber atau berubah; selalu ikuti petugas PMI.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* QUICK STATS FOR CRITICAL STIGMAS */}
      <section className="bg-red-50 py-10 px-4 border-y border-red-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">Mitos & Fakta Umum 🤔</h3>
            <p className="text-sm text-slate-500 mt-1">Informasi umum, bukan nasihat medis pribadi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">🍔</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: donor bikin gemuk?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Donor darah bukan program diet dan tidak dianjurkan untuk tujuan itu. Alasan utama donor adalah membantu pasien.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">💉</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: jarumnya besar dan sakit?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Rasanya berbeda-beda. Sebagian orang hanya merasakan sensasi singkat saat jarum masuk, sebagian lain lebih tidak nyaman. Bilang ke petugas kalau kamu takut.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">🌀</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: bikin lemas berhari-hari?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Sebagian orang bisa merasa pusing atau lemas setelah donor. Tidur cukup, makan, dan minum sebelum donor, istirahat sesudahnya, dan ikuti arahan petugas. Kalau terasa berat atau tidak reda, segera minta bantuan.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: GAME SIMULATOR KELAYAKAN DONOR (Smart Eligibility Quiz) */}
      <section id="quiz-section" className="max-w-4xl mx-auto w-full px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Quiz Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-red-800 text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <div className="inline-block bg-red-600 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                🎮 KUIS EDUKASI · 4 PERTANYAAN
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-none">
                Kuis Panduan Awal Donor Darah 🩺
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-1">
                Kuis singkat untuk belajar apa yang biasanya ditanyakan sebelum donor. Hasilnya bukan keputusan medis.
              </p>
            </div>
            
            {/* Visual Icon */}
            <div className="p-3 bg-white/10 rounded-2xl text-2xl relative hidden sm:block animate-bounce">
              🧪
            </div>
          </div>

          <div className="p-6 md:p-10">

            {/* STEP 0: NAME INPUT & WELCOME GATEWAY */}
            {quizStep === 0 && (
              <div id="quiz-gate" className="text-center py-6">
                <span className="text-5xl block mb-4 animate-pulse">🦸‍♂️</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">
                  Siapa Nama Pahlawan Kita Hari Ini?
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-sm mx-auto">
                  Tulis nama panggilan (boleh nama samaran). Nama dan jawaban kuismu dikirim ke server untuk menyusun ringkasan; lihat bagian Privasi di bawah.
                </p>

                <div className="mt-6 max-w-sm mx-auto">
                  <label htmlFor="visitor-name-input" className="sr-only">
                    Nama panggilan pahlawan
                  </label>
                  <input 
                    id="visitor-name-input"
                    type="text"
                    maxLength={VISITOR_NAME_MAX_CHARS}
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Contoh: Farhan / Rizki / Aurel..."
                    className="w-full text-center p-4 rounded-2xl border-2 border-slate-200 focus:border-red-500 focus:outline-none font-bold text-lg text-slate-800 placeholder-slate-400 bg-slate-50 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && visitorName.trim() !== "") {
                        setHasEnteredName(true);
                        setQuizStep(1);
                      }
                    }}
                  />
                  
                  <button
                    id="btn-start-quiz"
                    disabled={!visitorName.trim()}
                    onClick={() => {
                      setHasEnteredName(true);
                      setQuizStep(1);
                    }}
                    className={`w-full mt-4 p-4 rounded-2xl font-extrabold text-sm shadow-md active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                      visitorName.trim() 
                        ? "bg-red-600 text-white hover:bg-red-700 cursor-pointer" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Mulai Simulator Kelayakan! 🚀
                  </button>
                </div>
              </div>
            )}

            {/* STEPS 1-4: ACTIVE WIZARD QUESTIONS */}
            {quizStep > 0 && quizStep <= 4 && (
              <div>
                
                {/* ProgressBar layout */}
                <div className="mb-8">
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                    <span>PROGRESS EVALUASI</span>
                    <span>Q{quizStep} DARI 4</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${(quizStep / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* ACTIVE QUESTION PANEL WITH TACTILE RESPONSIVE BUTTONS */}
                <div className="min-h-[220px] flex flex-col justify-between">
                  
                  {/* QUESTION 1 */}
                  {quizStep === 1 && (
                    <div id="question-1" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 1: USIA & BERAT BADAN
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Halo <span className="text-red-600 underline font-black">{visitorName}</span>, apakah umurmu minimal 17 tahun dan berat badanmu minimal 45 kg?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Batas berat badan bisa lebih tinggi untuk kantong 450 mL (mis. 55 kg menurut Permenkes 91/2015). Petugas PMI yang menimbang dan memutuskan.
                      </p>
                      
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q1-safe"
                          onClick={() => answerQuizQuestion("ageWeight", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Ya, kurasa sudah memenuhi
                        </button>
                        <button
                          id="btn-q1-unsafe"
                          onClick={() => answerQuizQuestion("ageWeight", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Belum, atau aku tidak yakin
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION 2 */}
                  {quizStep === 2 && (
                    <div id="question-2" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 2: KUALITAS TIDUR
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Apakah kamu cukup istirahat dan merasa sehat hari ini, {visitorName}?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        PMI menganjurkan tidur cukup sebelum donor. Kami tidak menetapkan jumlah jam tidur tertentu.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q2-safe"
                          onClick={() => answerQuizQuestion("sleep", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Ya, cukup istirahat dan merasa sehat
                        </button>
                        <button
                          id="btn-q2-unsafe"
                          onClick={() => answerQuizQuestion("sleep", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Kurang istirahat atau kurang fit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION 3 */}
                  {quizStep === 3 && (
                    <div id="question-3" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 3: SAKIT & PENGOBATAN
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Apakah kamu sedang sakit, atau sedang menjalani pengobatan / minum obat tertentu (termasuk antibiotik)?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Petugas menilai penyakit dan jenis obatnya satu per satu. Sebutkan semua obat yang kamu minum saat pemeriksaan.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q3-safe"
                          onClick={() => answerQuizQuestion("meds", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Tidak sedang sakit atau berobat
                        </button>
                        <button
                          id="btn-q3-unsafe"
                          onClick={() => answerQuizQuestion("meds", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Ya, sedang sakit atau berobat
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION 4 */}
                  {quizStep === 4 && (
                    <div id="question-4" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 4: JEDA WAKTU
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Pertanyaan terakhir: apakah kamu baru-baru ini donor darah (dalam 3 bulan terakhir), atau membuat tato, tindik, atau akupunktur (dalam 1 tahun terakhir)?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Jeda minimal berbeda antar sumber resmi (donor: 2-3 bulan; tato/tindik: beberapa bulan hingga 1 tahun), jadi kami memakai rentang yang paling hati-hati. Petugas PMI yang memutuskan.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q4-safe"
                          onClick={() => finishQuiz("safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Tidak, sudah lewat atau tidak pernah
                        </button>
                        <button
                          id="btn-q4-unsafe"
                          onClick={() => finishQuiz("unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-755 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Ya, baru-baru ini
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Back button */}
                <div className="mt-8 flex justify-start">
                  <button 
                    id="btn-back-step"
                    onClick={() => setQuizStep(quizStep - 1)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-650 flex items-center gap-1.5"
                  >
                    ← Kembali ke pertanyaan sebelumnya
                  </button>
                </div>

              </div>
            )}

            {/* STEP 5: FINAL EVALUATION SCREEN (Green card if Lolos, Yellow/Helpful callback if Unsafe) */}
            {quizStep === 5 && (
              <div id="quiz-results" className="text-left animate-fade-in">
                {isQuizEvaluating ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    {/* Pulsing Loading Spinner */}
                    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Menyiapkan penjelasan hasil kuis...
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Menghubungi AI untuk menulis penjelasan. Jika tidak tersedia, kami tampilkan ringkasan otomatis.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Real Evaluation Box Layout */}
                    <div className={`p-6 md:p-8 rounded-3xl border ${
                      allQuizAnswersSafe(answers)
                        ? "bg-sky-50/60 border-sky-200 text-sky-900"
                        : "bg-amber-50/60 border-amber-200 text-amber-900"
                    } shadow-sm overflow-hidden relative`}>
                      
                      {/* Check badge background decoration */}
                      <span className="absolute -top-10 -right-10 text-9xl opacity-10 select-none">
                        {allQuizAnswersSafe(answers) ? "🩸" : "ℹ️"}
                      </span>

                      <div className="relative z-10">
                        {parseMarkdown(quizResult)}
                        <p className="mt-4 text-[11px] font-semibold text-slate-600">
                          {quizSource === "ai"
                            ? "Penjelasan ditulis AI dan bisa keliru. Ini bukan nasihat medis."
                            : quizNotice || OFFLINE_NOTICE}
                        </p>
                      </div>
                    </div>

                    <div
                      role="note"
                      className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-amber-100 px-4 py-3.5 text-amber-950 shadow-sm"
                    >
                      <span className="text-xl leading-none shrink-0" aria-hidden="true">⚠️</span>
                      <p className="text-sm font-semibold leading-relaxed">
                        {MEDICAL_DISCLAIMER}
                      </p>
                    </div>

                    <HeroCard visitorName={visitorName} />

                    {/* Quick Call-to-action cards based on result */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-2xl mt-1">📍</span>
                        <div>
                          <strong className="text-xs text-slate-800 block">Ada di mana Kantor PMI terdekat?</strong>
                          <span className="text-[10.5px] text-slate-500 block mt-0.5">Cari UTD PMI terdekat lewat ayodonor.pmi.or.id atau peta digital, lalu pastikan jam layanannya sebelum datang.</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-2xl mt-1">🥤</span>
                        <div>
                          <strong className="text-xs text-slate-800 block">Tips sebelum meluncur:</strong>
                          <span className="text-[10.5px] text-slate-500 block mt-0.5">Tidur cukup, makan dan minum seperti biasa, lalu ikuti arahan petugas saat di lokasi.</span>
                        </div>
                      </div>
                    </div>

                    {/* Reset Button to retake quiz */}
                    <div className="mt-8 flex justify-center gap-3">
                      <button
                        id="btn-reset-quiz"
                        onClick={resetQuiz}
                        aria-label="Ulangi kuis"
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      >
                        🔄 Ulangi Kuis
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </section>

      {/* SECTION 3: AI DONOR COMPANION (CHATBOX FRONTEND) */}
      <section id="chat-section" className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 py-1.5 px-4 rounded-full uppercase tracking-wider">
              💬 ASISTEN AI · BETA
            </span>
            <h2 className="text-3xl font-black text-slate-800 mt-3">
              Chat Sobat Hero AI 🤖
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Tanya hal umum seputar donor darah. Jawaban AI bisa keliru dan bukan nasihat medis; syarat resmi tetap ditentukan PMI.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-lg flex flex-col h-[520px]">
            
            {/* Companion bar */}
            <div className="bg-gradient-to-r from-red-650 to-red-600 text-white p-4 flex items-center justify-between border-b border-red-100 bg-red-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xl animate-pulse">
                  💧
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">Sobat Hero AI</h4>
                  <p className="text-[10px] text-red-100 flex items-center gap-1 mt-0.5" role="status">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        aiStatus === "ai" ? "bg-emerald-400" : aiStatus === "fallback" ? "bg-amber-400" : "bg-slate-300"
                      }`}
                    />
                    {aiStatus === "ai"
                      ? "Terhubung ke AI"
                      : aiStatus === "fallback"
                        ? "Mode offline: balasan otomatis"
                        : "Siap menjawab (AI bila tersedia)"}
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono bg-red-900/30 px-3 py-1 rounded-full text-red-100">
                {aiStatus === "ai" ? "AI aktif" : aiStatus === "fallback" ? "AI tidak tersedia" : "Beta"}
              </div>
            </div>

            {/* Chat message display area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    chat.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Chat bubble avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm ${
                    chat.role === "user" ? "bg-slate-900 text-white" : "bg-red-600 text-white"
                  }`}>
                    {chat.role === "user" ? "👋" : "💧"}
                  </div>
                  
                  {/* Bubble Content */}
                  <div className={`p-4 rounded-2xl ${
                    chat.role === "user" 
                      ? "bg-slate-900 text-white rounded-tr-none text-sm font-semibold" 
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm text-sm"
                  }`}>
                    {chat.role === "user" ? chat.text : parseMarkdown(chat.text)}
                    {chat.role === "model" && chat.source && (
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        {chat.source === "ai"
                          ? "Dijawab AI · bisa keliru, bukan nasihat medis"
                          : chat.source === "fallback"
                            ? "⚠️ Balasan otomatis, bukan dari AI"
                            : "Pesan sistem"}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isChatSending && (
                <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm shrink-0 shadow-sm animate-bounce">
                    💧
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-none shadow-sm text-sm italic flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
                    </span>
                    Sobat Hero AI lagi menyiapkan jawaban...
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Predefined suggestion chips */}
            <div className="bg-slate-100 p-2.5 border-t border-slate-200 overflow-x-auto flex gap-2 whitespace-nowrap">
              <button
                id="chip-gemuk"
                onClick={() => sendChatMessage("Apakah donor darah bikin gemuk? 🍔")}
                aria-label="Apakah donor darah bikin gemuk?"
                className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-350 text-xs font-bold py-1.5 px-3 rounded-full cursor-pointer active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                🍔 Bikin Gemuk?
              </button>
              <button
                id="chip-jarum"
                onClick={() => sendChatMessage("Takut jarum suntik, gimana ya caranya biar gak gemeteran? 💉")}
                aria-label="Takut jarum suntik, gimana ya caranya biar gak gemeteran?"
                className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-350 text-xs font-bold py-1.5 px-3 rounded-full cursor-pointer active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                💉 Takut Jarum Suntik
              </button>
              <button
                id="chip-lemas"
                onClick={() => sendChatMessage("Beneran bikin lemas pusing loyo gak sih? 🌀")}
                aria-label="Beneran bikin lemas pusing loyo gak sih?"
                className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-350 text-xs font-bold py-1.5 px-3 rounded-full cursor-pointer active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                🌀 Lemes & Pusing?
              </button>
              <button
                id="chip-tato"
                onClick={() => sendChatMessage("Punya tato hiasan boleh donor gak sih seleranya? 🎨")}
                aria-label="Punya tato hiasan boleh donor gak sih?"
                className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-350 text-xs font-bold py-1.5 px-3 rounded-full cursor-pointer active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                🎨 Tato Boleh Donor?
              </button>
            </div>

            {/* Message input layout */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <label htmlFor="chat-message-input" className="sr-only">
                Tulis pertanyaan untuk Sobat Hero AI
              </label>
              <input
                id="chat-message-input"
                type="text"
                maxLength={CHAT_MESSAGE_MAX_CHARS}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanya hal umum soal donor darah..."
                className="flex-1 p-3.5 border border-slate-200 focus:border-red-500 focus:outline-none rounded-xl text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendChatMessage(chatInput);
                  }
                }}
              />
              <button
                id="btn-send-message"
                onClick={() => sendChatMessage(chatInput)}
                aria-label="Kirim pesan ke Sobat Hero AI"
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 font-extrabold text-sm shadow-md active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center gap-1"
              >
                Kirim
              </button>
            </div>

          </div>

        </div>
      </section>

      <PrivacyNotice />

      {/* DETAILED FOOTER SECTION */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 mt-auto border-t border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
          
          <div className="md:col-span-5 text-left">
            <h3 className="text-white font-black text-xl flex items-center gap-2 mb-3">
              <span className="w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse shrink-0" />
              AyoDonor
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Proyek edukasi independen tentang donor darah untuk generasi muda Indonesia. AyoDonor bukan layanan medis dan tidak berafiliasi dengan PMI maupun Kemenkes.
            </p>
          </div>

          <div className="md:col-span-3 text-left">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Navigasi Interaktif</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <a href="#education" className="hover:text-red-500 transition-colors">🏡 Dasar-dasar Donor Darah</a>
              <a href="#pmi-locator-container" className="hover:text-red-500 transition-colors">📍 Contoh Lokasi (Data Demo)</a>
              <a href="#quiz-section" className="hover:text-red-500 transition-colors">🩺 Kuis Panduan Awal</a>
              <a href="#chat-section" className="hover:text-red-500 transition-colors">💬 Tanya Sobat Hero AI</a>
              <a href="#privasi" className="hover:text-red-500 transition-colors">🔒 Privasi & Data</a>
            </div>
          </div>

          <div className="md:col-span-4 text-left">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🛡️ Informasi Medis & Disclaimer</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kuis dan teks di AyoDonor hanya untuk edukasi. Bukan diagnosis, bukan keputusan kelayakan, dan bukan nasihat medis. Kelayakan donor ditentukan petugas PMI lewat pemeriksaan langsung. Data lokasi dan stok di situs ini adalah contoh yang belum diverifikasi. Jawaban AI bisa keliru.
              <span className="block mt-2">
                Sumber utama: Permenkes No. 91 Tahun 2015 tentang Standar Pelayanan Transfusi Darah dan FAQ PMI (ayodonor.pmi.or.id). Daftar klaim dan sumbernya ada di docs/medical-claims.md.
              </span>
            </p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} AyoDonor. Dibuat dengan penuh rasa hormat kepedulian kemanusiaan bagi keselamatan sesama.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 italic max-w-xs md:text-right">
              Info resmi: ayodonor.pmi.or.id
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
