// Black-box SEO check of a running site: HTTP status, redirects, per-page metadata, sitemap, robots.txt, 404 handling.
//
//   node scripts/seo-audit.mjs                          # http://127.0.0.1:8787 (wrangler dev on a fresh `npm run build`)
//   node scripts/seo-audit.mjs http://127.0.0.1:8787
//   node scripts/seo-audit.mjs https://ayodonor.web.id  # production (robots.txt/sitemap.xml fail until they are deployed)
//
// Needs Node 18+ (global fetch) and no dependencies. Exits 1 if any check fails. Canonical addresses are always expected on
// the production origin, whatever origin is being audited. This checks what the server answers; it does not say whether
// Google has indexed anything (that is Search Console, see docs/seo.md).

const BASE = (process.argv[2] ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const SITE = "https://ayodonor.web.id";
const PAGES = ["/", "/panduan", "/fakta-mitos", "/lokasi", "/tentang"];

let failures = 0;
const ok = (name) => console.log(`  ok    ${name}`);
const bad = (name, detail) => {
  failures += 1;
  console.log(`  FAIL  ${name}${detail ? `: ${detail}` : ""}`);
};
const check = (name, cond, detail) => (cond ? ok(name) : bad(name, detail));

const get = (p, init = {}) => fetch(BASE + p, { redirect: "manual", ...init });
const meta = (html, re) => html.match(re)?.[1];
const locationPath = (res) => {
  const l = res.headers.get("location");
  if (!l) return null;
  const u = new URL(l, BASE);
  return u.pathname + u.search;
};

console.log(`Auditing ${BASE}\n\nStatus and redirects`);
for (const p of PAGES) {
  const res = await get(p);
  check(`${p} -> 200 html`, res.status === 200 && /text\/html/.test(res.headers.get("content-type") ?? ""), `${res.status} ${res.headers.get("content-type")}`);
}
for (const p of ["/tidak-ada", "/tidak-ada/dalam", "/assets/tidak-ada.js"]) {
  const res = await get(p);
  const body = await res.text();
  check(`${p} -> 404 with the 404 page`, res.status === 404 && body.includes("Halaman tidak ditemukan"), `${res.status}`);
}
for (const [from, to] of [["/panduan/", "/panduan"], ["/panduan.html", "/panduan"], ["/index.html", "/"], ["/404.html", "/404"]]) {
  const res = await get(from);
  check(`${from} redirects to ${to}`, [301, 302, 307, 308].includes(res.status) && locationPath(res) === to, `${res.status} ${res.headers.get("location")}`);
}
{
  const res = await get("/404");
  const body = await res.text();
  check("/404 (the 404 page's own address) is noindex by header and meta", /noindex/i.test(res.headers.get("x-robots-tag") ?? "") && /<meta name="robots" content="noindex"/.test(body), `x-robots-tag=${res.headers.get("x-robots-tag")}`);
  check("404 page has no canonical and no og:url", !/rel="canonical"/.test(body) && !/og:url/.test(body));
  console.log(`  info  /404 answers ${res.status} (known static-assets behaviour; noindex covers it)`);
}

console.log("\nPer-page metadata");
const titles = new Set();
const descriptions = new Set();
for (const p of PAGES) {
  const res = await get(p);
  const html = await res.text();
  const title = meta(html, /<title>([^<]*)<\/title>/);
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/);
  const want = SITE + p;
  check(`${p} <html lang="id"> and viewport`, /<html lang="id"/.test(html) && /name="viewport" content="width=device-width, initial-scale=1.0"/.test(html));
  check(`${p} has a title and description`, Boolean(title) && Boolean(desc));
  check(`${p} canonical is ${want}`, canonical === want, canonical);
  check(`${p} og:url, og:title, og:description match`, meta(html, /og:url" content="([^"]*)"/) === want && meta(html, /og:title" content="([^"]*)"/) === title && meta(html, /og:description" content="([^"]*)"/) === desc);
  check(`${p} is not noindex`, !/name="robots"/i.test(html) && !res.headers.get("x-robots-tag"));
  titles.add(title);
  descriptions.add(desc);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  for (const a of assets) {
    const r = await get(a);
    check(`${p} asset ${a}`, r.status === 200, String(r.status));
  }
  console.log(`  info  ${p}  title ${title?.length} chars, description ${desc?.length} chars`);
}
check("titles are unique", titles.size === PAGES.length);
check("descriptions are unique", descriptions.size === PAGES.length);

console.log("\nsitemap.xml and robots.txt");
{
  const res = await get("/sitemap.xml");
  const xml = await res.text();
  check("sitemap.xml -> 200 xml", res.status === 200 && /xml/.test(res.headers.get("content-type") ?? ""), `${res.status} ${res.headers.get("content-type")}`);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check("sitemap lists exactly the five canonical pages", JSON.stringify(locs) === JSON.stringify(PAGES.map((p) => SITE + p)), locs.join(" "));
  check("sitemap has no lastmod", !/<lastmod>/.test(xml));
}
{
  const res = await get("/robots.txt");
  const txt = await res.text();
  check("robots.txt -> 200 text/plain", res.status === 200 && /text\/plain/.test(res.headers.get("content-type") ?? ""), `${res.status} ${res.headers.get("content-type")}`);
  check(`robots.txt names ${SITE}/sitemap.xml`, txt.includes(`Sitemap: ${SITE}/sitemap.xml`));
  check("robots.txt has no Disallow", !/^\s*disallow:/im.test(txt));
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
