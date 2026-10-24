// Build-time SEO helpers shared by vite.config.ts (which writes the files) and the tests (which check them).
// Everything is derived from the route table in routes.ts so the sitemap and structured data cannot drift from the pages.

import { canonicalUrl, ROUTES } from "./routes";

/**
 * sitemap.xml: the canonical address of every real page and nothing else (no 404, assets, redirects or query strings).
 * There is deliberately no <lastmod>: the build has no trustworthy per-page "meaningfully changed" date, and a date that
 * changes on every build (or an invented one) is worse than none. A sitemap helps discovery; it does not guarantee indexing.
 */
export function buildSitemap(): string {
  const urls = ROUTES.map((r) => `  <url>\n    <loc>${canonicalUrl(r.path)}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * schema.org WebSite for the home page only. It states just what the site visibly is: its name, address and language.
 * No Organization, MedicalOrganization, rating, review or location data: none of that is true or documented for AyoDonor.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AyoDonor",
    url: canonicalUrl("/"),
    inLanguage: "id",
    description: ROUTES[0].description,
  };
}

/** A <script type="application/ld+json"> tag; "<" is escaped so the JSON can never close the script element. */
export function jsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/**
 * What a visitor or crawler without JavaScript gets in the raw HTML: a plain link list to the five pages (the pages
 * themselves are rendered by the app). It is a small fallback, not a substitute for prerendering the page content.
 */
export function noscriptNav(): string {
  const items = ROUTES.map((r) => `<li><a href="${r.path}">${r.label.replace(/&/g, "&amp;")}</a></li>`).join("");
  return `<noscript><p>AyoDonor menampilkan isi halaman dengan JavaScript. Aktifkan JavaScript, atau buka salah satu halaman ini:</p><nav aria-label="Halaman AyoDonor"><ul>${items}</ul></nav></noscript>`;
}
