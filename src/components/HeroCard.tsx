import React, { useEffect, useRef, useState } from "react";
import { Download, Check, Copy } from "lucide-react";
import { buildCardSvg, CARD_DISCLAIMER, safeFileName } from "./heroCardSvg";

interface HeroCardProps {
  visitorName: string;
}

// "Kartu Niat Donor": a symbolic invitation the visitor can download or share. It certifies nothing.
export default function HeroCard({ visitorName }: HeroCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  // Move focus into the dialog when it opens, close on Escape, and hand focus back to the trigger.
  useEffect(() => {
    if (!showShareModal) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowShareModal(false);
        shareButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showShareModal]);

  return (
    <div id="hero-card-container" className="intent">
      <p className="kicker">Ajakan simbolis · bukan sertifikat</p>
      <h4 className="chapter__title" style={{ marginBottom: 0 }}>
        Kartu Niat Donor
      </h4>

      <p className="kicker kicker--plain" style={{ marginTop: "var(--s-5)" }}>
        Dibuat untuk:
      </p>
      <p className="intent__name">{displayName}</p>
      <p style={{ maxWidth: "36rem" }}>Aku berniat ikut donor darah di PMI setelah pemeriksaan oleh petugas.</p>
      <p className="small muted" style={{ fontFamily: "var(--font-mono)" }}>
        Dibuat pada {todayStr}
      </p>

      <p role="note" className="callout callout--caution">
        {CARD_DISCLAIMER}
      </p>

      <div className="intent__actions">
        <button onClick={downloadCardAsSvg} className="btn">
          <Download aria-hidden="true" />
          Unduh kartu (.svg)
        </button>

        <button ref={shareButtonRef} onClick={() => setShowShareModal(true)} className="btn btn--quiet">
          Bagikan ajakan
        </button>
      </div>

      {showShareModal && (
        <div className="dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="dialog">
            <p id="share-dialog-title" className="dialog__title">
              Bagikan ajakan donor darah
            </p>

            <p className="small">Salin teks di bawah ini untuk dibagikan ke LinkedIn, WhatsApp, atau media sosial lain.</p>

            <div className="field">
              <label htmlFor="hero-share-text" className="sr-only">
                Teks untuk dibagikan
              </label>
              <textarea id="hero-share-text" readOnly value={shareText} rows={5} />
            </div>

            <div className="intent__actions">
              <button onClick={copyShareText} aria-label={copied ? "Teks sudah disalin" : "Salin teks"} className="btn btn--quiet">
                {copied ? (
                  <>
                    <Check aria-hidden="true" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              {shareUrl && (
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--quiet"
                >
                  Buka LinkedIn
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>
              )}

              <button
                ref={closeButtonRef}
                onClick={() => {
                  setShowShareModal(false);
                  shareButtonRef.current?.focus();
                }}
                className="btn"
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
