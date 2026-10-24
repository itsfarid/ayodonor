import React, { useState } from "react";
import { Download, Linkedin, Check, Copy, Heart } from "lucide-react";
import { buildCardSvg, CARD_DISCLAIMER, safeFileName } from "./heroCardSvg";

interface HeroCardProps {
  visitorName: string;
}

export default function HeroCard({ visitorName }: HeroCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const displayName = visitorName.trim() || "Sobat";

  const todayStr = React.useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("id-ID", options);
  }, []);

  const downloadCardAsSvg = () => {
    const blob = new Blob([buildCardSvg(displayName, todayStr)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kartu_Niat_Donor_${safeFileName(displayName)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareText = `Aku berniat jadi pendonor darah! 🩸\n\nYuk cari tahu syarat resminya di PMI (ayodonor.pmi.or.id).\n#AyoDonor`;

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div id="hero-card-container" className="mt-8 bg-slate-900 rounded-3xl border border-red-500/30 p-1 relative overflow-hidden shadow-2xl">
      <div className="bg-slate-900/90 rounded-[22px] px-6 py-8 md:p-8 text-left text-white relative z-10">
        <div className="border-b border-white/10 pb-5 mb-5 md:mb-6">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#FDBA74] uppercase block">
            Ajakan simbolis · bukan sertifikat
          </span>
          <h4 className="text-xl font-black tracking-tight text-white leading-none mt-1">Kartu Niat Donor</h4>
        </div>

        <div className="relative border border-white/5 bg-white/[0.03] rounded-2xl p-6 mb-4">
          <p className="text-[11px] font-mono font-bold tracking-widest text-red-300 uppercase leading-none">Dibuat untuk:</p>
          <h5 className="text-3xl md:text-4xl font-black text-white mt-2 tracking-tight break-words">{displayName}</h5>
          <p className="text-sm text-slate-200 leading-relaxed max-w-md mt-3">
            Aku berniat ikut donor darah di PMI setelah pemeriksaan oleh petugas.
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-4">Dibuat pada {todayStr}</p>
        </div>

        <p role="note" className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3 mb-6 leading-relaxed">
          {CARD_DISCLAIMER}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={downloadCardAsSvg}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-red-500 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <Download className="w-4 h-4 shrink-0" />
            Unduh kartu (.svg)
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all border border-slate-700 shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
            Bagikan ajakan
          </button>
        </div>
      </div>

      {showShareModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm text-slate-800"
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl relative text-left">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm mb-3">
              <Heart className="w-4 h-4 fill-current text-red-600" />
              <span id="share-dialog-title">Bagikan ajakan donor darah</span>
            </div>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Salin teks di bawah ini untuk dibagikan ke LinkedIn, WhatsApp, atau media sosial lain.
            </p>

            <div className="mt-5 relative">
              <label htmlFor="hero-share-text" className="sr-only">
                Teks untuk dibagikan
              </label>
              <textarea
                id="hero-share-text"
                readOnly
                value={shareText}
                rows={5}
                className="w-full text-slate-700 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:outline-none font-medium text-xs leading-relaxed"
              />

              <button
                onClick={copyShareText}
                aria-label={copied ? "Teks sudah disalin" : "Salin teks"}
                className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs p-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {shareUrl && (
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <Linkedin className="w-4 h-4 shrink-0" />
                  Buka LinkedIn
                </a>
              )}

              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-xl transition-all text-center outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
