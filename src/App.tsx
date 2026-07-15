import React, { useState, useEffect, useRef } from "react";
import PmiLocator from "./components/PmiLocator";
import HeroCard from "./components/HeroCard";

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
    if (cleanLine.startsWith("*") || cleanLine.startsWith("-")) {
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

export default function App() {
  // Navigation / Interactive Education Cards state
  const [activeEducationTab, setActiveEducationTab] = useState<string>("kesehatan");
  
  // Blood Split Simulator state
  const [bloodAmountMl, setBloodAmountMl] = useState<number>(350);

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
  const [isQuizEvaluating, setIsQuizEvaluating] = useState<boolean>(false);

  // Chatbot State
  const [chatOpened, setChatOpened] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; text: string }>>([
    {
      role: "model",
      text: "Halo Kak! 😎 Aku **AyoDonor Buddy**. Takut jarum suntik? Takut gemuk? Atau bingung syarat PMI? Tanyain aja semuanya ke aku, bakal aku jawab dengan bahasa santuy bin menghibur!"
    }
  ]);
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, chatOpened]);

  // Initial welcome message or local checking
  useEffect(() => {
    // Check connection with api
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => console.log("Server Health:", data))
      .catch((err) => console.warn("API disconnect warning, using fallbacks:", err));
  }, []);

  // Handle Quiz Step Progression
  const answerQuizQuestion = (questionKey: "ageWeight" | "sleep" | "meds" | "recency", val: "safe" | "unsafe") => {
    const updatedAnswers = { ...answers, [questionKey]: val };
    setAnswers(updatedAnswers);
    
    if (quizStep < 4) {
      setQuizStep(quizStep + 1);
    }
  };

  // Trigger Gemini API evaluation
  const evaluateEligibility = async (finalAnswers: typeof answers) => {
    setIsQuizEvaluating(true);
    setQuizResult("");
    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: visitorName || "Sobat Hero",
          ageWeight: finalAnswers.ageWeight,
          sleep: finalAnswers.sleep,
          meds: finalAnswers.meds,
          recency: finalAnswers.recency
        }),
      });
      const data = await response.json();
      if (data.success) {
        setQuizResult(data.text);
      } else {
        throw new Error(data.error || "Gagal mendapat evaluasi");
      }
    } catch (err) {
      // Graceful local evaluation fallback in case of no server
      console.error(err);
      const isEligible = finalAnswers.ageWeight === "safe" && finalAnswers.sleep === "safe" && finalAnswers.meds === "safe" && finalAnswers.recency === "safe";
      if (isEligible) {
        setQuizResult(`### 🎉 Mantap Jiwa, **${visitorName || "Sobat Hero"}**! \n\nBerdasarkan 4 pertanyaan ini, kamu **KEMUNGKINAN BESAR** memenuhi syarat awal — tapi keputusan akhir tetap ditentukan lewat pemeriksaan medis langsung di PMI (cek Hb, tensi, riwayat kesehatan lengkap).\n\n*   **Umur & Badan:** Sip banget!\n*   **Tidur:** Cukup dan bugar!\n*   **Kondisi medis:** Fit luar dalam!\n*   **Jeda Jarak:** Aman tentram!\n\nYuk, datang ke unit PMI terdekat buat screening resmi. Satu kantong darah darimu bisa jadi mukjizat buat 3 nyawa. Jangan lupa minum air yang cukup sebelum datang ya, gaes! 🩸🚀`);
      } else {
        const adviceList = [];
        if (finalAnswers.ageWeight !== "safe") adviceList.push("*   **Umur / BB Belum Pas:** Minimal umur 17 tahun dan berat badan 45 kg ya, sob. Tubuh butuh sirkulasi darah yang stabil agar darahmu aman didonor.");
        if (finalAnswers.sleep !== "safe") adviceList.push("*   **Begadang Mania:** Tidur semalam kurang dari 5 jam bisa bikin tensimu berantakan! Tidur dulu yuk sekarang.");
        if (finalAnswers.meds !== "safe") adviceList.push("*   **Detoks Obat / Menstruasi:** Obat-obatan bertahan beberapa hari di darah, dan saat haid tubuh wanita kehilangan zat besi gila-gilaan. Sembuh & bugar dulu ya!");
        if (finalAnswers.recency !== "safe") adviceList.push("*   **Jarak Terlalu Kilat:** Butuh 2 bulan jeda antar donor, biar sel darah merahmu recover seutuhnya. Tato baru perlu jeda 6 bulan.");

        setQuizResult(`### 💊 Selangkah Lagi Jadi Hero, **${visitorName || "Sobat"}**! \n\nNiat muliamu patut diacungi jempol, tapi tubuhmu hari ini ngasih sinyal untuk re-charge dulu. Berikut catatan kecil buatmu:\n\n${adviceList.join("\n")}\n\n**Solusi Santuy:** Jangan berkecil hati! Minum air putih hangat yang banyak hari ini, tidur pules 7-8 jam nanti malam, dan yuk coba cek kelayakan lagi lain hari! Sobat tetap calon pahlawan sejati! 🌟`);
      }
    } finally {
      setIsQuizEvaluating(false);
    }
  };

  // Send message to Gemini chatbox
  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || isChatSending) return;
    
    const userMsg = { role: "user" as const, text: msg };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: chatHistory
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatHistory((prev) => [...prev, { role: "model", text: data.text }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      // Friendly local answer context
      const lower = msg.toLowerCase();
      const keywords = ["donor", "darah", "jarum", "sakit", "lemas", "lemes", "pusing", "haid", "obat", "tato", "tindik", "tensi", "hb", "gemuk", "berat", "kelayakan", "tidur", "pmi", "kesehatan", "tubuh", "nyawa", "pahlawan", "hero", "manfaat", "syarat", "plasma", "trombosit", "kantong"];
      const isRelated = keywords.some(kw => lower.includes(kw));

      let localReply = "Duh hampura, AI Buddy lagi rada lemot jaringannya. Tapi intinya donor darah itu aman & menyehatkan kok, kuy!";

      if (!isRelated) {
        localReply = "### 🥤 Waduh, OOT (Out of Topic) Nih, Sob! \n\nTopik itu menarik banget (kayak manis-gurihnya es cendol, atau hal seru lainnya!), tapi **AyoDonor Buddy** ini khusus dilatih untuk membahas seputar donor darah, mitos medis, serta info kelayakan kesehatan tubuh demi aksi heroik menyelamatkan 3 nyawa! \n\nDaripada ngomongin yang lain, yuk tanyain hal seputar donor darah aja. Contohnya: \n* 'Apakah donor darah bikin gemuk?' \n* 'Takut jarum suntik, gimana dong?' \n* 'Kenapa gak boleh begadang sebelum donor?'";
      } else if (lower.includes("gemuk")) {
        localReply = "### Mitos Gedenya: 'Donor Bikin Gemuk'\n\n**Faktanya:** Donor darah gak bikin badan melar. Tubuh memang memakai energi ekstra untuk regenerasi darah yang disumbangkan — tapi itu **efek samping regenerasi**, bukan alasan utama buat donor, apalagi bukan program diet.\n\nMotivasi utamanya tetap **menyelamatkan nyawa**. Yang bikin melar biasanya porsi balas dendam makan geprek double nasi setelahnya! 🍔";
      } else if (lower.includes("jarum") || lower.includes("takut") || lower.includes("sakit")) {
        localReply = "### Tips Usir Takut Jarum\n\n1. Tangkup mata kalian atau buang muka pas ditusuk.\n2. Tarik napas dalem 3 detik, gak lebih sakit dari digigit semut buduk!\n3. Bayangin habis donor dapet mie instan cup dan biskuit hangat PMI. Kenikmatan hakiki!";
      } else if (lower.includes("lemas") || lower.includes("pusing")) {
        localReply = "### Kenapa Ada yang Lemes?\n\nItu biasanya karena begadang semalemnya atau belum sarapan air putih dan karbo. Asal persiapan sobat matang, habis donor malah ngerasa fressh bertenaga!";
      }
      setChatHistory((prev) => [...prev, { role: "model", text: localReply }]);
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
              #GlowUpTubuh & #Save3Nyawa
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
                Intip Manfaat Gokil 💡
              </a>
              <a 
                href="#quiz-section" 
                className="bg-red-700/40 text-white border border-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-700/60 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600"
              >
                Cek Kelayakan Kamu 🔍
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
              <p className="text-xs text-red-200 mt-1">Edukator Donor Darah yang Humoris & Siap Bantu Tubuhmu Makin Fit!</p>
            </div>

            <div className="mt-3 bg-red-800/60 text-red-100 text-[11px] font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              ❤️ PMI READY PARTNER
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
              <div className="text-2xl font-black text-slate-800">1 Kantong</div>
              <div className="text-xs text-slate-500 font-medium">Bisa Menyelamatkan 3 Nyawa</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 sm:py-0 justify-center sm:pl-6 pl-0">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">3 Nyawa</div>
              <div className="text-xs text-slate-500 font-medium">Potensi Terselamatkan per Kantong</div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 sm:py-0 justify-center sm:pl-6 pl-0">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">Gratis</div>
              <div className="text-xs text-slate-500 font-medium">Mini Medical Check Up Berkala</div>
            </div>
          </div>
        </div>
      </section>

      {/* PMI LOCATOR SECTION */}
      <div id="pmi-locator-container">
        <p className="max-w-6xl mx-auto w-full px-4 pt-6 text-center text-xs text-slate-500 leading-relaxed">
          Lokasi berikut adalah contoh data untuk demo. Untuk info stok darah akurat, hubungi PMI terdekat atau cek pmi.or.id.
        </p>
        <PmiLocator />
      </div>

      {/* SECTION 1: DASHBOARD MANFAAT MULTI-DIMENSI (Interactive Grid) */}
      <main id="education" className="max-w-6xl mx-auto w-full px-4 py-12 flex-grow">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Dashboard Manfaat Multi-Dimensi 💡
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto mt-2 text-sm">
            Siapa bilang donor darah cuma bikin lemas? Donormu itu investasi terbaik buat kesehatan sendiri sekaligus aksi pahlawan sejati!
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
            🔥 Glow-Up Tubuh
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
            🦸 Live Pahlawan
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
            🩺 Profit Personal
          </button>
        </div>

        {/* TAB 1: KESEHATAN (Glow-Up Tubuh) */}
        {activeEducationTab === "kesehatan" && (
          <div id="content-kesehatan" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl">
                ⚙️
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                Reset Pabrik Sel Darah Kita: Seperti Ganti Oli Mobil!
              </h3>
              
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Pas kita donor, tubuh kita mendadak "kehilangan" sekitar 350ml-450ml darah. Otak langsung ngasih komando supercepat ke sumsum tulang belakang: <strong className="text-slate-900">"Woi darurat! Bikin sel darah merah baru sekarang juga!"</strong>
                </p>
                
                <p className="bg-red-50/50 p-4 rounded-2xl border-l-4 border-red-500 text-slate-700 italic">
                  "Hasilnya? Sel darah usangmu yang udah lambat di-tackle diganti sama sel darah baru gres yang dipenuhi oksigen murni tinggi. Kamu langsung dapet alami Glow-Up kesegaran organ tubuh & kulit cerah!"
                </p>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✔</span>
                    <span><strong>Turunkan Kolesterol:</strong> Sirkulasi lancar otomatis cegah sumbatan plak di pembuluh arteri jantung.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✔</span>
                    <span><strong>Tubuh Regenerasi Darah:</strong> Saat mengganti volume yang didonorkan, tubuh memakai energi ekstra — bonus sampingan saja; motivasi utamanya tetap menyelamatkan nyawa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✔</span>
                    <span><strong>Keseimbangan Zat Besi:</strong> Membantu menjaga kadar zat besi tubuh tetap seimbang.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Visual illustration for health tab */}
            <div className="bg-gradient-to-br from-red-50 to-rose-100/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-red-100 shadow-inner relative overflow-hidden">
              <div className="text-center font-mono text-xs text-red-600 font-semibold mb-4 uppercase tracking-wider relative z-10">
                ⚡ INDONESIA FIT RED-CYCLE ENGINE
              </div>
              
              {/* Animation Graphic Gear-like system */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                <div className="absolute w-44 h-44 rounded-full border-4 border-dashed border-red-300 animate-spin opacity-50" />
                <div className="absolute w-32 h-32 rounded-full border-4 border-red-500 border-t-transparent animate-spin" style={{ animationDirection:"reverse", animationDuration: "3s" }} />
                
                <span className="text-7xl relative z-10 animate-bounce">🏎️</span>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl text-center shadow-sm max-w-sm border border-slate-100">
                <div className="text-sm font-bold text-slate-800">"Sistem Sirkulasi Ter-Reset"</div>
                <p className="text-xs text-slate-500 mt-1">Darah kotor tersaring keluar, sel darah muda yang superaktif meluncur demi menaikkan staminamu!</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOSIAL (Pahlawan Real-Life) */}
        {activeEducationTab === "sosial" && (
          <div id="content-sosial" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl">
                🦸‍♂️
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                1 Kantong Istimewa, 3 Jiwa Pulang ke Rumah!
              </h3>
              
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Darah merah pekat yang kamu donor itu gak bakal langsung dituang mentah-mentah ke pasien lain. Di laboratorium palang merah, cairan berhargamu disaring dan dipecah jadi **3 pahlawan kecil**:
                </p>

                <div className="grid grid-cols-1 gap-3 my-4">
                  <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <span className="text-xl">🎒</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">1. Sel Darah Merah (PRC)</strong>
                      <span className="text-xs text-slate-500">Membantu banget nyawa korban kecelakaan parah hebat, anemia akut berat, atau ibu pasca melahirkan pendarahan.</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-yellow-50/80 p-3 rounded-xl border border-yellow-100">
                    <span className="text-xl">🥛</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">2. Plasma Cairan Kuning (FFP)</strong>
                      <span className="text-xs text-slate-500">Penting luar biasa untuk terapi penderita luka bakar parah, syok kekurangan cairan, serta kelainan faktor pembekuan darah.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <span className="text-xl">🧪</span>
                    <div>
                      <strong className="text-slate-800 text-sm block">3. Trombosit Konsentrat (TC)</strong>
                      <span className="text-xs text-slate-500">Sangat vital bagi kesembuhan adik-adik pasien demam berdarah dengue (DBD) parah, penderita leukimia, dan bayi prematur.</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-700">
                  Kamu gak perlu jadi miliarder dulusan buat jadi penyelamat peradaban atau pahlawan tanpa jubah. Cukup sedekah secangkir cairan cinta merahmu!
                </p>
              </div>
            </div>

            {/* Interactive Split Blood Simulator */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-between">
              <div>
                <div className="text-center font-mono text-xs text-red-600 font-semibold mb-4 uppercase tracking-wider">
                  🩸 INTERACTIVE KANTONG SPLITTER
                </div>
                
                <p className="text-xs text-center text-slate-500 mb-6">
                  Geser takaran darah di bawah ini buat ngeliat perpecahan komposisi nutrisi penyelamat yang dihasillkan!
                </p>

                {/* Amount Slider Control */}
                <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm grow-0 max-w-xs mx-auto mb-6">
                  <div className="text-xs text-slate-400 font-bold uppercase">Volume Kantong Donor</div>
                  <div className="text-3xl font-black text-red-600 mt-1">{bloodAmountMl} ml</div>
                  
                  <input 
                    id="blood-slider"
                    type="range" 
                    min={250} 
                    max={450} 
                    value={bloodAmountMl}
                    onChange={(e) => setBloodAmountMl(parseInt(e.target.value))}
                    className="w-full accent-red-600 mt-3 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>250ml (Kecil)</span>
                    <span>450ml (Maks)</span>
                  </div>
                </div>

                {/* Composites layout visualizer */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>🎒 Sel Darah Merah (PRC - 45%)</span>
                      <span className="text-red-600 font-mono">{Math.round(bloodAmountMl * 0.45)} ml</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 animate-pulse" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>🥛 Plasma Cairan (FFP - 50%)</span>
                      <span className="text-yellow-600 font-mono">{Math.round(bloodAmountMl * 0.50)} ml</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: "50%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>🧪 Trombosit (TC - 5%)</span>
                      <span className="text-rose-600 font-mono">{Math.round(bloodAmountMl * 0.05)} ml</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 animate-pulse" style={{ width: "5%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-dashed border-slate-200 pt-4 text-center">
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  🌟 Menyelematkan Keluarga Pasien dari Krisis Darah!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PERSONAL BENEFIT (Medical Check-Up Gratis) */}
        {activeEducationTab === "personal" && (
          <div id="content-personal" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl mb-4 text-xl">
                🩺
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                Mini Medical Check-Up Berkala Tanpa Bayar Sepeserpun!
              </h3>
              
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  Sering mager keluar duit ratusan ribu buat sekadar berkonsultasi cek tensi dan darah di klinik mewah? Hehehe, di PMI kalian dikasih gratis tuntas tiap 2-3 bulan sekali!
                </p>

                <p>
                  Sebelum darahmu dihisap keluar, dokter/petugas medis handal bakal menyaring kelayakanmu lewat serangkaian biosensor cek medis utama:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1">🩸</span>
                    <strong className="text-slate-800 text-xs block">Screening Hb (Hemoglobin)</strong>
                    <span className="text-[10.5px] text-slate-500">Mendeteksi anemiaku/kekentalan oksigen darahmu.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1">💓</span>
                    <strong className="text-slate-800 text-xs block">Cek Tensi Jantung</strong>
                    <span className="text-[10.5px] text-slate-500">Memantau laju tekanan darah sistolik dan diastolikmu.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1">🧪</span>
                    <strong className="text-slate-800 text-xs block">Skrining Menular</strong>
                    <span className="text-[10.5px] text-slate-500">Terproteksi dari HIV, Sifilis, Hepatitis B, & C bebas biaya.</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xl block mb-1">🍫</span>
                    <strong className="text-slate-800 text-xs block">Vibe Booster Snack</strong>
                    <span className="text-[10.5px] text-slate-500">Diberikan suplemen vitamin, telur, biskuit, susu gratis!</span>
                  </div>
                </div>

                <p className="text-xs text-rose-500 italic font-mono">
                  *Bila terdeteksi ada anomali dilarang donor, petugas bakal memberi tahu rahasia medis ini secara privat dan menyarankan panduan rujukan pemulihan terbaik!
                </p>
              </div>
            </div>

            {/* Mini Game Visual: Checking health meter */}
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-700 shadow-2xl relative min-h-[300px]">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono py-1 px-3 rounded-full uppercase">
                    👨‍⚕️ STANDAR REKOMENDASI PMI
                  </span>
                  <span className="text-xs text-slate-400 font-mono">2026 UPDATE</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-semibold text-slate-300">Tekanan Darah Sehat:</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">90/60 - 160/100 mmHg</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-semibold text-slate-300">Kadar Hemoglobin (Hb):</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">12.5 - 17.0 g/dL</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-semibold text-slate-300">Berat Badan Ideal:</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">Min. 45 Kg</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Suhu Hangat Tubuh:</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">36.5°C - 37.5°C</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-300 italic">"Gak perlu was-was bayar cek laboratorium, semuanya gratis disokong pahlawan nusa!"</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* QUICK STATS FOR CRITICAL STIGMAS */}
      <section className="bg-red-50 py-10 px-4 border-y border-red-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">Mitos Nyeleneh vs Kebenaran Mutlak 🤔</h3>
            <p className="text-sm text-slate-500 mt-1">Jangan gampang kemakan gosip tongkrongan sebelah, ini fakta ilmiahnya!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">🍔</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: Gara-gara donor jadi gemuk?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Donor darah bukan program diet. Tubuh memang memakai energi untuk regenerasi darah — tapi alasan utamanya tetap kemanusiaan. Ngerasa gemuk? Biasanya karena porsi balas dendam bakso jumbo 2 mangkuk setelahnya, ya jelas melar sob!
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">💉</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: Jarum suntiknya gede & sakit?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Rasa cubitannya cuma kayak digigit semut lewat 3 detik awal! Lebih sakit lagi liat doi gandeng orang lain pas malem minggu belaka.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-100/60 shadow-sm relative overflow-hidden">
              <span className="absolute top-2 right-2 text-xl">🌀</span>
              <h4 className="font-extrabold text-red-600 mb-2 text-sm">Katanya: Bisa bikin tubuh lemas berhari-hari?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Faktanya:</strong> Selama tidurmu sebelum donor di atas 5 jam & cukup minum air putih, stamina malah tambah joss berkat sel muda baru kaya oksigen!
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
                🎮 LOCAL INTERACTIVE STORYBOARD
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-none">
                Game Simulator Kelayakan 🩺
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-1">
                Gak perlu baca regulasi PMI yang kaku & panjang. Cukup mainkan kuis taktil interaktif ini seketika!
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
                  Tulis panggilan akrabmu agar Droppy AI Buddy bisa nge-review fisikmu secara personal & akurat!
                </p>

                <div className="mt-6 max-w-sm mx-auto">
                  <label htmlFor="visitor-name-input" className="sr-only">
                    Nama panggilan pahlawan
                  </label>
                  <input 
                    id="visitor-name-input"
                    type="text"
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
                        Halo <span className="text-red-600 underline font-black">{visitorName}</span>, apakah umurmu di kisaran 17 sampai 60 tahun dengan Berat Badan minimal mencapai 45 Kg?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        PMI mewajibkan BB minimal 45kg agar volume sirkulasi darah luar aman tersuplai tanpa kerasa pening.
                      </p>
                      
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q1-safe"
                          onClick={() => answerQuizQuestion("ageWeight", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Ya, Umur & BB-ku Masuk Kategori Sip!
                        </button>
                        <button
                          id="btn-q1-unsafe"
                          onClick={() => answerQuizQuestion("ageWeight", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Wah, BB-ku Dibawah 45 Kg / Usia Belum Pas
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
                        Tidur semalam cukup gak, {visitorName}? Dapat minimal 5 jam tidur nyenyak sebelum hari ini?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Begadang ekstrem bisa mengacaukan pembacaan tensi darah di atas rata-rata normal medis. Kami peduli fisikmu!
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q2-safe"
                          onClick={() => answerQuizQuestion("sleep", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Cukup Banget, Terlelap Nyenyak!
                        </button>
                        <button
                          id="btn-q2-unsafe"
                          onClick={() => answerQuizQuestion("sleep", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Begadang Kurang Tidur nih / Sulit Rekam Jam
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION 3 */}
                  {quizStep === 3 && (
                    <div id="question-3" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 3: OBAT, ANTIBIOTIK & HAID
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Apakah sobat sedang konsumsi obat antibiotik dalam 3 hari terakhir, atau sedang Masa Haid (Khusus Wanita)?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Obat penawar di darah menyaring beberapa hari. Wanita haid juga berisiko pening pudar hemoglobin saat mendonor.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q3-safe"
                          onClick={() => answerQuizQuestion("meds", "safe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Aman, Gak Ada Konsumsi Obat / Haid!
                        </button>
                        <button
                          id="btn-q3-unsafe"
                          onClick={() => answerQuizQuestion("meds", "unsafe")}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-750 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Iya, Sedang Minum Obat / Haid
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION 4 */}
                  {quizStep === 4 && (
                    <div id="question-4" className="text-center md:text-left">
                      <div className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        KATEGORI 4: JEDA WAKTU & SENI TATO
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                        Pertanyaan terakhir: Baru donor dalam 2 bulan terkahir atau bikin seni tato/tindik baru dalam 6 bulan kemarin?
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Sel darah butuh 56 hari buat regenerasi penuh. Tato baru butuh sterilisasi antibodi hepatitis luar demi higienitas ketat.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          id="btn-q4-safe"
                          onClick={async () => {
                            setAnswers(prev => ({ ...prev, recency: "safe" }));
                            await evaluateEligibility({ ...answers, recency: "safe" });
                            setQuizStep(5);
                          }}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          🟢 Gak Pernah, Aman Terkendali!
                        </button>
                        <button
                          id="btn-q4-unsafe"
                          onClick={async () => {
                            setAnswers(prev => ({ ...prev, recency: "unsafe" }));
                            await evaluateEligibility({ ...answers, recency: "unsafe" });
                            setQuizStep(5);
                          }}
                          className="min-h-[52px] p-4 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 text-slate-755 shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          ❌ Iya, Baru Saja Donor / Pasang Tato
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
                      Droppy AI Buddy Sedang Menganalisis Sel Darahmu...
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Menghubungi jembatan pintar Gemini 3 Flash server-side. Sabar 1 detik ya!
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Real Evaluation Box Layout */}
                    <div className={`p-6 md:p-8 rounded-3xl border ${
                      answers.ageWeight === "safe" && answers.sleep === "safe" && answers.meds === "safe" && answers.recency === "safe"
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : "bg-amber-50/60 border-amber-200 text-amber-900"
                    } shadow-sm overflow-hidden relative`}>
                      
                      {/* Check badge background decoration */}
                      <span className="absolute -top-10 -right-10 text-9xl opacity-10 select-none">
                        {answers.ageWeight === "safe" && answers.sleep === "safe" && answers.meds === "safe" && answers.recency === "safe" ? "❇️" : "⚠️"}
                      </span>

                      <div className="relative z-10">
                        {parseMarkdown(quizResult)}
                      </div>
                    </div>

                    <div
                      role="note"
                      className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-amber-100 px-4 py-3.5 text-amber-950 shadow-sm"
                    >
                      <span className="text-xl leading-none shrink-0" aria-hidden="true">⚠️</span>
                      <p className="text-sm font-semibold leading-relaxed">
                        Ini bukan diagnosis medis. Kriteria lengkap dan pemeriksaan resmi hanya dilakukan oleh petugas PMI saat kamu datang langsung.
                      </p>
                    </div>

                    {answers.ageWeight === "safe" && answers.sleep === "safe" && answers.meds === "safe" && answers.recency === "safe" && (
                      <HeroCard visitorName={visitorName} />
                    )}

                    {/* Quick Call-to-action cards based on result */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-2xl mt-1">📍</span>
                        <div>
                          <strong className="text-xs text-slate-800 block">Ada di mana Kantor PMI terdekat?</strong>
                          <span className="text-[10.5px] text-slate-500 block mt-0.5">Sobat bisa buka peta digital cari "PMI terdekat" atau langsung sambangi gedung pusat kota madya masing-masing!</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-2xl mt-1">🥤</span>
                        <div>
                          <strong className="text-xs text-slate-800 block">Tips sebelum meluncur:</strong>
                          <span className="text-[10.5px] text-slate-500 block mt-0.5">Minum minimal 3-4 gelas air putih hangat, hindari konsumsi gorengan kolesterol tinggi sesaat sebelum daftar ya.</span>
                        </div>
                      </div>
                    </div>

                    {/* Reset Button to retake quiz */}
                    <div className="mt-8 flex justify-center gap-3">
                      <button
                        id="btn-reset-quiz"
                        onClick={resetQuiz}
                        aria-label="Ulangi kuis kelayakan"
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      >
                        🔄 Check Kelayakan Lagi
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
      <section className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 py-1.5 px-4 rounded-full uppercase tracking-wider">
              💬 REAL INTEGRATION DEMO
            </span>
            <h2 className="text-3xl font-black text-slate-800 mt-3">
              Chat Sobat Hero AI 🤖
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Punya keluh kesah, ketakutan terpendam, atau mitos aneh seputar donor? Tanya Droppy AI seketika!
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
                  <h4 className="font-extrabold text-sm leading-tight">Droppy, AyoDonor Buddy AI</h4>
                  <p className="text-[10px] text-red-200 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-heartbeat" />
                    Online & Selalu Humoris
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono bg-red-900/30 px-3 py-1 rounded-full text-red-100">
                ⚡ models/gemini-3.5-flash
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
                    Droppy lagi mikir jawaban lawak...
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
                Tulis pertanyaan untuk Droppy
              </label>
              <input
                id="chat-message-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanyakan ketakutanmu di sini (e.g., 'sakit gak?', 'dapat biskuit apa?')..."
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
                aria-label="Kirim pesan ke Droppy"
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 font-extrabold text-sm shadow-md active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center gap-1"
              >
                Kirim
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* DETAILED FOOTER SECTION */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 mt-auto border-t border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
          
          <div className="md:col-span-5 text-left">
            <h3 className="text-white font-black text-xl flex items-center gap-2 mb-3">
              <span className="w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse shrink-0" />
              AyoDonor
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Inisiatif platform literasi dan edukasi donor darah interaktif untuk merangkul generasi muda Indonesia menjadi pahlawan nyata di dunia riil. Ditenagai oleh teknologi kecerdasan buatan demi mempercepat ketersediaan persediaan darah yang kritis di tanah air.
            </p>
          </div>

          <div className="md:col-span-3 text-left">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Navigasi Interaktif</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <a href="#intro" className="hover:text-red-500 transition-colors">🏡 Beranda & Edukasi</a>
              <a href="#pmi-locator-container" className="hover:text-red-500 transition-colors font-semibold">📍 Cari Lokasi PMI Terdekat</a>
              <a href="#eligibility" className="hover:text-red-500 transition-colors">🩺 Kuis Kelayakan Sederhana</a>
              <a href="#companion" className="hover:text-red-500 transition-colors">💬 Konsultasi Bersama Droppy</a>
            </div>
          </div>

          <div className="md:col-span-4 text-left">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🛡️ Informasi Medis & Disclaimer</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pemeriksaan kelayakan dalam aplikasi AyoDonor bersifat skrining mandiri awal edukatif dan bukan pengganti diagnosis medis formal. Sebelum melakukan donor darah, pemeriksaan fisik komprehensif (kadar Hb, tensi, serta riwayat klinis terperinci) akan dilakukan secara resmi dan aman oleh staf medis profesional PMI di lapangan.
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
              "Setetes darahmu, nafas panjang harapan hidup bagi mereka yang membutuhkan."
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
