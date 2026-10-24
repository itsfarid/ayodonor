/** Escapes text for safe interpolation into SVG/XML text nodes and attributes. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

export const CARD_DISCLAIMER =
  "Kartu ini bukan sertifikat, bukan hasil pemeriksaan medis, dan bukan dokumen resmi PMI atau Kemenkes.";

export function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 40) || "Sobat";
}

/** Builds the downloadable "Kartu Niat Donor". The name is escaped; no status or code is claimed. */
export function buildCardSvg(visitorName: string, dateText: string): string {
  const name = escapeXml(visitorName.trim().slice(0, 50) || "Sobat");
  const date = escapeXml(dateText);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450" role="img" aria-label="Kartu Niat Donor untuk ${name}">
  <rect width="800" height="450" rx="36" fill="#B91C1C" stroke="#FECACA" stroke-width="6"/>
  <g transform="translate(100, 95) scale(0.6)">
    <path d="M0,-40 C0,-40 40,15 40,45 A40,40 0 0 1 -40,45 C-40,15 0,-40 0,-40 Z" fill="#ffffff"/>
    <circle cx="-12" cy="15" r="5" fill="#B91C1C"/>
    <circle cx="12" cy="15" r="5" fill="#B91C1C"/>
    <path d="M-6,25 Q0,31 6,25" stroke="#B91C1C" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <text x="170" y="80" font-family="system-ui, sans-serif" font-weight="800" font-size="30" fill="#ffffff">KARTU NIAT DONOR</text>
  <text x="170" y="110" font-family="system-ui, sans-serif" font-size="14" fill="#FECACA">AyoDonor · edukasi donor darah</text>
  <line x1="60" y1="160" x2="740" y2="160" stroke="#FCA5A5" stroke-width="2" opacity="0.4"/>
  <text x="100" y="205" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="#FDBA74">DIBUAT UNTUK</text>
  <text x="100" y="260" font-family="system-ui, sans-serif" font-weight="800" font-size="42" fill="#ffffff">${name}</text>
  <text x="100" y="305" font-family="system-ui, sans-serif" font-size="15" fill="#ffffff">Saya berniat ikut donor darah di PMI setelah pemeriksaan oleh petugas.</text>
  <text x="100" y="350" font-family="system-ui, sans-serif" font-size="12" fill="#FECACA">${escapeXml(CARD_DISCLAIMER)}</text>
  <text x="100" y="400" font-family="system-ui, sans-serif" font-size="12" fill="#FDBA74">Dibuat pada ${date}</text>
</svg>
`;
}
