import fs from "fs";
import os from "os";
import path from "path";
import { JSDOM } from "jsdom";
import { build, preview, type PreviewServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { canonicalUrl, NOT_FOUND_META, ROUTES, SITE_URL } from "../src/routes";
import { jsonLdScript } from "../src/seo";

// Builds the real site into a temp directory (never touching ./dist) and inspects what a static
// host such as Cloudflare Pages would serve. Needs no API key, server or network.
const ROOT = path.join(__dirname, "..");
const ENV_MARKER = "FAKE_ENV_SECRET_MARKER_DO_NOT_SHIP";

let outDir: string;
let files: string[];
let server: PreviewServer;
let baseUrl: string;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}
const rel = (f: string) => path.relative(outDir, f).split(path.sep).join("/");
const text = (f: string) => fs.readFileSync(f, "utf8");

beforeAll(async () => {
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ayodonor-static-"));
  process.env.AYODONOR_TEST_SECRET = ENV_MARKER; // must never reach the output
  // Vitest sets NODE_ENV=test, which would make React ship its development build. `npm run build`
  // is a production build, so build the same way here.
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await build({ root: ROOT, mode: "production", logLevel: "silent", build: { outDir, emptyOutDir: true } });
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
  files = walk(outDir);
  server = await preview({
    root: ROOT,
    logLevel: "silent",
    build: { outDir },
    preview: { host: "127.0.0.1", port: 41000 + Math.floor(Math.random() * 2000), strictPort: false },
  });
  baseUrl = server.resolvedUrls!.local[0].replace(/\/$/, "");
}, 180_000);

afterAll(async () => {
  delete process.env.AYODONOR_TEST_SECRET;
  await server?.close();
  fs.rmSync(outDir, { recursive: true, force: true });
});

describe("static build output", () => {
  it("contains index.html that references only files present in the output", () => {
    const html = text(path.join(outDir, "index.html"));
    expect(html).toContain('<div id="root">');
    const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith("//"));
    expect(refs.length).toBeGreaterThanOrEqual(3); // js, css, favicon
    for (const ref of refs) expect(fs.existsSync(path.join(outDir, ref)), ref).toBe(true);
    expect(refs.some((r) => r.endsWith(".js"))).toBe(true);
    expect(refs.some((r) => r.endsWith(".css"))).toBe(true);
  });

  it("uses root-absolute asset paths that work on a custom domain", () => {
    const html = text(path.join(outDir, "index.html"));
    expect(html).not.toMatch(/(?:src|href)="\.\//);
    expect(html).not.toMatch(/https?:\/\/(?:localhost|127\.0\.0\.1)/);
  });

  it("contains only static web assets, one HTML file per page, and Cloudflare control files", () => {
    for (const f of files.map(rel)) {
      expect(f, f).toMatch(/^(index|panduan|fakta-mitos|lokasi|tentang|404)\.html$|^(favicon\.svg|_headers|robots\.txt|sitemap\.xml)$|^assets\/[\w.-]+\.(js|css)$/);
    }
  });

  it("has a prerendered HTML file for every route, with its own title, description and canonical address", () => {
    const seenTitles = new Set<string>();
    for (const r of ROUTES) {
      const file = r.path === "/" ? "index.html" : `${r.path.slice(1)}.html`;
      expect(fs.existsSync(path.join(outDir, file)), file).toBe(true);
      const html = text(path.join(outDir, file));
      expect(html, file).toContain(`<title>${r.title}</title>`);
      expect(html, file).toContain(`content="${r.description}"`);
      expect(html, file).toContain(`<link rel="canonical" href="${canonicalUrl(r.path)}" />`);
      expect(html, file).toContain('<div id="root">');
      expect(html, file).toMatch(/\/assets\/[\w.-]+\.js/);
      expect(html, file).toMatch(/\/assets\/[\w.-]+\.css/);
      seenTitles.add(r.title);
    }
    expect(seenTitles.size).toBe(ROUTES.length);
  });

  it("has a 404.html that is not indexed and has no canonical address", () => {
    const html = text(path.join(outDir, "404.html"));
    expect(html).toContain(`<title>${NOT_FOUND_META.title}</title>`);
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).not.toContain('rel="canonical"');
  });

  it("exposes no source maps, env files, server bundles or worker code", () => {
    for (const f of files.map(rel)) {
      expect(f).not.toMatch(/\.map$|(^|\/)\.env|\.cjs$|\.mjs$|server|_worker|functions/i);
    }
    for (const f of files.filter((x) => /\.(js|css|html)$/.test(x))) {
      expect(text(f), rel(f)).not.toMatch(/sourceMappingURL/);
    }
  });

  it("never embeds environment values or secrets", () => {
    for (const f of files) {
      const content = text(f);
      expect(content, rel(f)).not.toContain(ENV_MARKER);
      expect(content, rel(f)).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|GEMINI|process\.env/);
    }
  });

  it("is a production build (no React development bundles)", () => {
    for (const f of files.filter((x) => x.endsWith(".js"))) {
      expect(text(f)).not.toMatch(/react\.development|react-jsx-dev-runtime|react-dom\.development/);
    }
  });

  it("makes no reference to the removed API or an AI provider", () => {
    for (const f of files.filter((x) => x.endsWith(".js"))) {
      expect(text(f)).not.toMatch(/\/api\/|genai|gemini|generativelanguage/i);
    }
  });

  it("the application source makes no network calls of its own", () => {
    // (Vite's module-preload helper in the bundle does call fetch() for its own same-origin chunks,
    // so the bundle itself is not scanned for fetch; the source is.)
    const src = fs
      .readdirSync(path.join(ROOT, "src"), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
      .map((e) => fs.readFileSync(path.join(e.parentPath, e.name), "utf8"))
      .join("\n");
    expect(src).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/);
  });

  it("ships the Cloudflare headers without a CSP that has not been browser-tested", () => {
    const headers = text(path.join(outDir, "_headers"));
    expect(headers).toMatch(/X-Content-Type-Options: nosniff/);
    expect(headers).toMatch(/Permissions-Policy: geolocation=\(self\)/);
    const directives = headers.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
    expect(directives).not.toMatch(/Content-Security-Policy/i);
  });

  it("marks the 404 page's own addresses noindex by header, and no public page", () => {
    const blocks = text(path.join(outDir, "_headers")).split(/\n(?=\S)/).map((b) => b.trim()).filter((b) => b && !b.startsWith("#"));
    const withRobots = blocks.filter((b) => /X-Robots-Tag/i.test(b)).map((b) => b.split("\n")[0]);
    expect(withRobots.sort()).toEqual(["/404", "/404.html"]);
    for (const r of ROUTES) expect(withRobots, r.path).not.toContain(r.path);
  });

  it("keeps the disclaimer and demo-data warnings in the shipped bundle", () => {
    const js = files.filter((x) => x.endsWith(".js")).map(text).join("\n");
    expect(js).toContain("Ini bukan diagnosis atau keputusan medis");
    expect(js).toContain("bisa belum lengkap atau sudah berubah");
    expect(js).toContain("tidak berafiliasi dengan PMI");
  });
});

describe("sitemap.xml and robots.txt", () => {
  const routeFile = (p: string) => (p === "/" ? "index.html" : `${p.slice(1)}.html`);

  it("sitemap.xml is well-formed UTF-8 XML listing exactly the five canonical pages, with no invented lastmod", () => {
    const xml = text(path.join(outDir, "sitemap.xml"));
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    // jsdom's XML parser throws on malformed XML.
    const doc = new JSDOM(xml, { contentType: "application/xml" }).window.document;
    expect(doc.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    const locs = [...doc.querySelectorAll("url > loc")].map((n) => n.textContent!);
    expect(locs).toEqual(ROUTES.map((r) => canonicalUrl(r.path)));
    expect(locs).toEqual([
      "https://ayodonor.web.id/",
      "https://ayodonor.web.id/panduan",
      "https://ayodonor.web.id/fakta-mitos",
      "https://ayodonor.web.id/lokasi",
      "https://ayodonor.web.id/tentang",
    ]);
    for (const loc of locs) expect(loc, loc).not.toMatch(/[?#]|\.html$|\/404|\/assets\/|[^:/]\/\//);
    for (const loc of locs.filter((l) => l !== `${SITE_URL}/`)) expect(loc, loc).not.toMatch(/\/$/); // no trailing-slash variants
    expect(doc.querySelectorAll("lastmod, changefreq, priority").length).toBe(0);
  });

  it("every sitemap URL is a built page whose own canonical is that URL and that is not noindex", () => {
    const doc = new JSDOM(text(path.join(outDir, "sitemap.xml")), { contentType: "application/xml" }).window.document;
    for (const loc of [...doc.querySelectorAll("loc")].map((n) => n.textContent!)) {
      const route = ROUTES.find((r) => canonicalUrl(r.path) === loc)!;
      const html = text(path.join(outDir, routeFile(route.path)));
      expect(html, loc).toContain(`<link rel="canonical" href="${loc}" />`);
      expect(html, loc).not.toMatch(/name="robots"/i);
    }
  });

  it("robots.txt allows everything, blocks no assets, and points at the absolute sitemap URL", () => {
    const robots = text(path.join(outDir, "robots.txt"));
    const lines = robots.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    expect(lines).toContain("User-agent: *");
    expect(lines).toContain("Allow: /");
    expect(lines.filter((l) => /^disallow:/i.test(l))).toEqual([]); // no Disallow at all: not "/", not /assets/
    expect(lines).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).not.toMatch(/noindex/i); // robots.txt noindex is not supported by Google
  });

  it("serves robots.txt and sitemap.xml with matching content types", async () => {
    const robots = await fetch(baseUrl + "/robots.txt");
    expect(robots.status).toBe(200);
    expect(robots.headers.get("content-type")).toMatch(/text\/plain/);
    const sitemap = await fetch(baseUrl + "/sitemap.xml");
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get("content-type")).toMatch(/xml/);
  });
});

describe("structured data (JSON-LD)", () => {
  const ldBlocks = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);

  it("the home page has exactly one valid schema.org WebSite that matches the visible site", () => {
    const html = text(path.join(outDir, "index.html"));
    const blocks = ldBlocks(html);
    expect(blocks).toHaveLength(1);
    const data = JSON.parse(blocks[0]);
    expect(data).toMatchObject({ "@context": "https://schema.org", "@type": "WebSite", name: "AyoDonor", url: `${SITE_URL}/`, inLanguage: "id" });
    expect(data.url).toBe(html.match(/<link rel="canonical" href="([^"]+)"/)![1]);
    expect(data.description).toBe(ROUTES[0].description);
    expect(html).toContain('<meta property="og:site_name" content="AyoDonor" />');
  });

  it("claims nothing the site cannot back: no organization, medical, rating, review or location data", () => {
    const blocks = files.filter((f) => f.endsWith(".html")).flatMap((f) => ldBlocks(text(f)));
    expect(blocks.join("\n")).not.toMatch(/Organization|Medical|Rating|Review|Offer|Place|GeoCoordinates|PostalAddress|telephone|sameAs|logo/i);
  });

  it("every other page and the 404 page carry no JSON-LD", () => {
    for (const f of files.filter((x) => x.endsWith(".html") && rel(x) !== "index.html")) expect(ldBlocks(text(f)), rel(f)).toEqual([]);
  });

  it("jsonLdScript cannot be broken out of by '<' in a value", () => {
    const tag = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(tag.match(/<script/g)).toHaveLength(1);
    expect(tag.match(/<\/script>/g)).toHaveLength(1);
    expect(JSON.parse(tag.replace(/^<script[^>]*>|<\/script>$/g, "")).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("routing configuration", () => {
  it("needs no redirects or fallback rule: every route is its own HTML file, and the router is a small History API one", () => {
    expect(fs.existsSync(path.join(ROOT, "public", "_redirects"))).toBe(false);
    const src = fs
      .readdirSync(path.join(ROOT, "src"), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
      .map((e) => fs.readFileSync(path.join(e.parentPath, e.name), "utf8"))
      .join("\n");
    expect(src).not.toMatch(/react-router|createBrowserRouter|BrowserRouter/);
    expect(JSON.stringify(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).dependencies))).not.toMatch(/router/);
  });

  it("deploys as an assets-only Worker: wrangler.jsonc names the dist directory, serves 404.html for unknown addresses, and has no script, bindings or secrets", () => {
    const raw = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf8");
    // JSONC: drop whole-line // comments (none of the values contains "//" at the start of a line).
    const config = JSON.parse(raw.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n"));
    expect(Object.keys(config).sort()).toEqual(["assets", "compatibility_date", "name"]);
    expect(config.name).toBe("ayodonor");
    expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(config.assets).toEqual({ directory: "./dist", not_found_handling: "404-page" });
    // "single-page-application" would answer unknown addresses with 200 (soft 404s); "none" gives an empty 404.
    expect(raw).not.toMatch(/single-page-application/);
    expect(fs.existsSync(path.join(ROOT, "dist", "404.html")) || files.map(rel).includes("404.html")).toBe(true);
  });

  it("has no Pages Functions or worker directory", () => {
    expect(fs.existsSync(path.join(ROOT, "functions"))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, "wrangler.toml"))).toBe(false);
  });
});

describe("served from the static output over HTTP", () => {
  it("serves / and the built assets", async () => {
    const home = await fetch(baseUrl + "/");
    expect(home.status).toBe(200);
    expect(home.headers.get("content-type")).toMatch(/text\/html/);
    const html = await home.text();
    const js = html.match(/src="(\/assets\/[^"]+\.js)"/)![1];
    const css = html.match(/href="(\/assets\/[^"]+\.css)"/)![1];
    expect((await fetch(baseUrl + js)).headers.get("content-type")).toMatch(/javascript/);
    expect((await fetch(baseUrl + css)).headers.get("content-type")).toMatch(/css/);
    expect((await fetch(baseUrl + "/favicon.svg")).status).toBe(200);
  });

  it("has no backend: /api/health is not a working endpoint", async () => {
    const res = await fetch(baseUrl + "/api/health");
    const body = await res.text();
    expect(body).not.toContain('"status":"ok"');
    expect(res.headers.get("content-type") ?? "").not.toMatch(/application\/json/);
  });

  it("does not serve env files or server code, even by direct path", async () => {
    for (const p of ["/.env", "/.env.local", "/server.ts", "/server/app.ts", "/dist/server/index.cjs", "/%2e%2e/.env.local"]) {
      const res = await fetch(baseUrl + p);
      const body = await res.text();
      expect(body, p).not.toContain(ENV_MARKER);
      expect(body, p).not.toMatch(/createApp|express|GEMINI|sourcesContent/);
    }
  });
});
