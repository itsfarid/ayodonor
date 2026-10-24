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
  const serif = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450" role="img" aria-label="Kartu Niat Donor untuk ${name}">
  <rect width="800" height="450" fill="#F8F4ED"/>
  <rect x="0.5" y="0.5" width="799" height="449" fill="none" stroke="#231E1C"/>
  <rect width="800" height="12" fill="#7B1428"/>
  <path d="M60,58 C60,58 78,82 78,94 A18,18 0 0 1 42,94 C42,82 60,58 60,58 Z" fill="#7B1428"/>
  <text x="96" y="86" font-family="${serif}" font-weight="700" font-size="28" fill="#231E1C">AyoDonor</text>
  <text x="740" y="86" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="#1D5360" letter-spacing="1">KARTU NIAT DONOR</text>
  <line x1="40" y1="120" x2="760" y2="120" stroke="#231E1C" stroke-width="1.5"/>
  <text x="60" y="175" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14" fill="#675E58" letter-spacing="1">DIBUAT UNTUK</text>
  <text x="60" y="235" font-family="${serif}" font-weight="600" font-size="44" fill="#231E1C">${name}</text>
  <text x="60" y="285" font-family="${sans}" font-size="18" fill="#4A423E">Saya berniat ikut donor darah di PMI setelah pemeriksaan oleh petugas.</text>
  <line x1="40" y1="330" x2="760" y2="330" stroke="#D8CFC0"/>
  <text x="60" y="362" font-family="${sans}" font-size="13" fill="#7A4D00">${escapeXml(CARD_DISCLAIMER)}</text>
  <text x="60" y="400" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#675E58">Dibuat pada ${date}</text>
</svg>
`;
}
