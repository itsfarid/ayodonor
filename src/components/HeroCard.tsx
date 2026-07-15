import React, { useState } from "react";
import { Download, Linkedin, Sparkles, Check, Copy, Award, ShieldCheck, Heart } from "lucide-react";

interface HeroCardProps {
  visitorName: string;
}

export default function HeroCard({ visitorName }: HeroCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Generate a distinct validation code for the hero certificate
  const heroCode = React.useMemo(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `HERO-2026-${randomNum}`;
  }, []);

  const todayStr = React.useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("id-ID", options);
  }, []);

  // Handle downloading the card as a high-quality SVG vector graphic
  const downloadCardAsSvg = () => {
    const cleanName = visitorName.trim() || "Sobat Hero";
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="50%" stop-color="#991B1B" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Outer glowing card boundary -->
  <rect width="800" height="500" rx="40" fill="url(#cardGrad)" stroke="#FECACA" stroke-width="6" />
  
  <!-- Subtle heart lines in the background -->
  <path d="M-100,500 Q 200,300 400,500 T 900,500" fill="none" stroke="#FECACA" stroke-width="2" opacity="0.15" />
  <path d="M-50,500 Q 250,200 450,500 T 950,500" fill="none" stroke="#FECACA" stroke-width="1.5" opacity="0.1" />

  <!-- Heartbeat baseline -->
  <path d="M 60,380 L 120,380 L 130,360 L 140,410 L 150,340 L 160,395 L 170,380 L 740,380" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.15" />

  <!-- Badge logo grid decoration -->
  <circle cx="100" cy="90" r="45" fill="#ffffff" opacity="0.1" />
  
  <!-- Droppy Mascot Drawing -->
  <g transform="translate(100, 95) scale(0.6)">
    <path d="M0, -40 C0, -40 40, 15 40, 45 A40, 40 0 0 1 -40, 45 C-40, 15 0, -40 0, -40 Z" fill="#ffffff" />
    <circle cx="-12" cy="15" r="5" fill="#DC2626" />
    <circle cx="12" cy="15" r="5" fill="#DC2626" />
    <path d="M-6, 25 Q 0, 31 6, 25" stroke="#DC2626" stroke-width="4" stroke-linecap="round" fill="none" />
  </g>

  <!-- Title & Texts -->
  <text x="180" y="75" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="2">AYODONOR HERO CARD</text>
  <text x="180" y="105" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="14" fill="#FECACA" letter-spacing="1">REGULATED UNDER HEALTH SENTINEL STATUS</text>
  
  <!-- Divider -->
  <line x1="60" y1="160" x2="740" y2="160" stroke="#fca5a5" stroke-width="2" opacity="0.3" />

  <!-- Recipient details -->
  <text x="100" y="210" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="14" fill="#FDBA74" letter-spacing="1.5">SERTIFIKAT KELAYAKAN DIGITAL</text>
  <text x="100" y="270" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="44" fill="#ffffff">${cleanName}</text>
  
  <text x="100" y="325" font-family="'Inter', system-ui, sans-serif" font-weight="500" font-size="14" fill="#ffffff" opacity="0.95">Dinyatakan 100% SIAP JADI HERO berdasarkan uji kelayakan mandiri.</text>
  <text x="100" y="348" font-family="'Inter', system-ui, sans-serif" font-weight="500" font-size="14" fill="#ffffff" opacity="0.95">Sobat dinyatakan bugar, fit, dan berstandar aman mendonorkan darah di PMI.</text>

  <!-- Footers metadata -->
  <g transform="translate(100, 425)">
    <text x="0" y="0" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="10" fill="#FDBA74" letter-spacing="0.5">REWARD LEVEL</text>
    <text x="0" y="22" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="16" fill="#ffffff">PLATINUM HERO</text>
  </g>

  <g transform="translate(320, 425)">
    <text x="0" y="0" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="10" fill="#FDBA74" letter-spacing="0.5">VERIFICATION CODE</text>
    <text x="0" y="22" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="0.5">${heroCode}</text>
  </g>

  <g transform="translate(540, 425)">
    <text x="0" y="0" font-family="'Inter', system-ui, sans-serif" font-weight="700" font-size="10" fill="#FDBA74" letter-spacing="0.5">DATE CERTIFIED</text>
    <text x="0" y="22" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="16" fill="#ffffff">${todayStr}</text>
  </g>

  <!-- Gold Stamp Seal -->
  <g transform="translate(680, 260)">
    <circle cx="0" cy="0" r="48" fill="url(#goldGrad)" stroke="#ffffff" stroke-width="2.5" filter="url(#glow)" />
    <!-- Heart outline inside seal -->
    <path d="M-12,-8 C-12,-18 0,-18 0,-8 C0,-18 12,-18 12,-8 C12,2 0,14 0,14 C0,14 -12,2 -12,-8 Z" fill="#ffffff" transform="scale(0.9)" />
    <circle cx="0" cy="0" r="32" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 3" />
  </g>
</svg>
`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sertifikat_AyoDonor_${cleanName.replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareText = `Halo dunia! Saya dinyatakan 100% SIAP JADI HERO Donor Darah di AyoDonor! 🩸✨\n\nYuk, ikut ambil bagian kurangi deviasi krisis suplai kantong darah di PMI nusa dengan hidup sehat & bugar.\n\nKode Verifikasi: ${heroCode}\n#AyoDonor #RealLifeHero #Save3Nyawa`;

  const copyShareText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="hero-card-container" className="mt-8 bg-slate-900 rounded-3xl border border-red-500/30 p-1 relative overflow-hidden shadow-2xl transition-all hover:border-red-500/50">
      
      {/* Absolute pulsing background lights */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-red-650 rounded-full filter blur-3xl opacity-20 -mr-6 -mt-6 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500 rounded-full filter blur-3xl opacity-15 -ml-4 -mb-4" />

      {/* Actual Glassmorphism Certificate Box */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-[22px] px-6 py-8 md:p-8 text-left text-white relative z-10">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5 mb-5 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 rounded-2xl border border-red-500/40 text-red-500 animate-pulse">
              <Award className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#FDBA74] uppercase block">PREMIUM COMPLIANT</span>
              <h4 className="text-xl font-black tracking-tight text-white leading-none mt-1">Sertifikat Kelayakan Digital</h4>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 rounded-xl text-xs font-black shadow-md border border-amber-400 flex items-center justify-center gap-1.5 self-start sm:self-center">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-200" />
            <span className="font-mono tracking-wide">PLATINUM HERO STATUS</span>
          </div>
        </div>

        {/* Certificate Card Body Preview */}
        <div className="relative border border-white/5 bg-white/[0.03] rounded-2.5xl p-6 mb-6 overflow-hidden">
          {/* Subtle heartbeat line inside vector preview */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          
          <span className="absolute bottom-4 right-4 text-8xl opacity-10 select-none animate-pulse">🩸</span>

          <div className="max-w-md relative z-10">
            <p className="text-[10.5px] font-mono font-bold tracking-widest text-red-400 uppercase leading-none">Diterbitkan Atas Nama:</p>
            <h5 className="text-3xl md:text-4xl font-black text-white mt-1.5 md:my-2 tracking-tight block drop-shadow-md">
              {visitorName || "Sobat Pahlawan"}
            </h5>
            
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mt-3">
              Hasil screening mandiri Anda menunjukkan status <strong className="text-emerald-400 font-bold border-b border-emerald-500/30">100% Lolos</strong> parameter krusial PMI (Kebugaran tidur, massa BB ideal, bebas antibiotik, & kesesuaian jeda sirkulasi).
            </p>
          </div>

          {/* Inline grid metadata items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 relative z-10">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#FDBA74] uppercase block">TINGKATAN LEVEL</span>
              <strong className="text-xs font-extrabold text-white">Platinum Donor Choice</strong>
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#FDBA74] uppercase block">KODE VERIFIKASI</span>
              <strong className="text-xs font-mono font-black text-white leading-none">{heroCode}</strong>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[9px] font-mono tracking-widest text-[#FDBA74] uppercase block">TANGGAL BERLAKU</span>
              <strong className="text-xs font-extrabold text-white">{todayStr}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls panel */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={downloadCardAsSvg}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-97 flex items-center justify-center gap-2 cursor-pointer border border-red-500"
          >
            <Download className="w-4 h-4 shrink-0 animate-bounce" />
            Download Kartu (.svg)
          </button>
          
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all border border-slate-700 shadow shadow-slate-950/20 active:scale-97 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
            Bagikan Ke LinkedIn / Sosmed
          </button>
        </div>

      </div>

      {/* SOCIAL SHARE MODAL DIALOG */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl relative text-left">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm mb-3">
              <Heart className="w-4 h-4 fill-current animate-pulse text-red-600" />
              <span>BAGIKAN PRESTASI SENSOR HERO-v26</span>
            </div>

            <h4 className="text-xl font-black text-slate-800">Siap Menginspirasi Warga Kampus & Sahabat! 🦸‍♂️</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Salin draf caption keren di bawah ini untuk kamu bagikan ke LinkedIn, feed WhatsApp, ataupun story garapanmu untuk merangkul pahlawan kemanusiaan baru!
            </p>

            {/* Editable Textbox Box */}
            <div className="mt-5 relative">
              <textarea
                readOnly
                value={shareText}
                rows={7}
                className="w-full text-slate-700 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:outline-none font-medium text-xs leading-relaxed"
              />
              
              <button
                onClick={copyShareText}
                className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs p-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>

            {/* Buttons row footer */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://ai.studio/build")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 hover:from-blue-800 hover:to-blue-700"
              >
                <Linkedin className="w-4 h-4 shrink-0" />
                Buka & Bagikan Ke LinkedIn
              </a>

              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-xl transition-all text-center"
              >
                Kembali
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
