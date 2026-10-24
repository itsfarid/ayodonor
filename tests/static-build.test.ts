import fs from "fs";
import os from "os";
import path from "path";
import { build, preview, type PreviewServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

  it("contains only static web assets and Cloudflare Pages control files", () => {
    for (const f of files.map(rel)) {
      expect(f, f).toMatch(/^(index\.html|favicon\.svg|_headers|assets\/[\w.-]+\.(js|css))$/);
    }
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

  it("keeps the disclaimer and demo-data warnings in the shipped bundle", () => {
    const js = files.filter((x) => x.endsWith(".js")).map(text).join("\n");
    expect(js).toContain("Ini bukan diagnosis atau keputusan medis");
    expect(js).toContain("belum diverifikasi");
    expect(js).toContain("tidak berafiliasi dengan PMI");
  });
});

describe("routing configuration", () => {
  it("needs no redirects: the app has a single page and no client-side router", () => {
    expect(fs.existsSync(path.join(ROOT, "public", "_redirects"))).toBe(false);
    const src = fs
      .readdirSync(path.join(ROOT, "src"), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
      .map((e) => fs.readFileSync(path.join(e.parentPath, e.name), "utf8"))
      .join("\n");
    expect(src).not.toMatch(/react-router|pushState|replaceState|location\.pathname|createBrowserRouter/);
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
