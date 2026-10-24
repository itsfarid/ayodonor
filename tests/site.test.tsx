// @vitest-environment jsdom
import fs from "fs";
import path from "path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const ROOT = path.join(__dirname, "..");

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("page structure and footer", () => {
  it("every in-page anchor points at an element that exists", () => {
    const { container } = render(<App />);
    const hrefs = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")!.slice(1));
    expect(hrefs.length).toBeGreaterThan(4);
    for (const id of hrefs) expect(document.getElementById(id), `#${id}`).not.toBeNull();
  });

  it("states independence from PMI/Kemenkes and the educational-only scope", () => {
    const { container } = render(<App />);
    const footer = container.querySelector("footer")!.textContent!;
    expect(footer).toMatch(/tidak berafiliasi dengan PMI maupun Kemenkes/);
    expect(footer).toMatch(/bukan keputusan kelayakan/);
    expect(footer).toMatch(/bisa belum lengkap atau sudah berubah/);
    expect(footer).toMatch(/tidak menampilkan stok darah/);
  });

  it("has a privacy section that matches the real (client-only) data flows", () => {
    const { container } = render(<App />);
    const privacy = container.querySelector("#privasi")!.textContent!;
    expect(privacy).toMatch(/hanya diproses di browser/);
    expect(privacy).toMatch(/tidak ada yang dikirim ke server/i);
    expect(privacy).toMatch(/tidak memakai layanan AI/);
    expect(privacy).toMatch(/Google Maps/);
    expect(privacy).toMatch(/tidak memuat font dari layanan lain/);
    expect(privacy).not.toMatch(/Gemini|dikirim ke server AyoDonor/);
  });
});

describe("index.html metadata", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  it("does not promise eligibility checks, official status or an image that does not exist", () => {
    expect(html).not.toMatch(/cek kelayakan|resmi dari PMI|summary_large_image|og:image/i);
    expect(html).toMatch(/tidak berafiliasi dengan PMI/);
    expect(html).not.toMatch(/asisten AI|chatbot|Gemini/i);
  });

  it("references a favicon that actually exists", () => {
    expect(html).toContain('href="/favicon.svg"');
    expect(fs.existsSync(path.join(ROOT, "public", "favicon.svg"))).toBe(true);
  });
});

describe("no third-party font or script requests", () => {
  it("loads no external font or stylesheet: the CSS uses system font stacks only", () => {
    const css = fs.readFileSync(path.join(ROOT, "src", "index.css"), "utf8");
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@import url\(/i);
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    expect(html).not.toMatch(/<link[^>]+(fonts\.|stylesheet)|<script[^>]+src="https?:/i);
  });
});

describe("accessibility landmarks", () => {
  it("has a skip link, one h1, a main landmark, and labelled navigation", () => {
    const { container } = render(<App />);
    expect(container.querySelector('a.skip-link[href="#konten"]')).not.toBeNull();
    expect(container.querySelector("main#konten")).not.toBeNull();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    for (const nav of container.querySelectorAll("nav")) expect(nav.getAttribute("aria-label"), nav.outerHTML.slice(0, 60)).toBeTruthy();
  });

  it("never nests interactive elements inside role=button and has no emoji-only controls", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    for (const b of container.querySelectorAll("button")) {
      expect((b.textContent ?? "").replace(/\s/g, "") || b.getAttribute("aria-label"), b.outerHTML.slice(0, 80)).toBeTruthy();
    }
  });

  it("does not use emoji as interface decoration", () => {
    const { container } = render(<App />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe("claims documentation", () => {
  it("exists and lists sources and open gaps", () => {
    const doc = fs.readFileSync(path.join(ROOT, "docs", "medical-claims.md"), "utf8");
    expect(doc).toMatch(/Permenkes No\. 91 Tahun 2015/);
    expect(doc).toMatch(/Celah verifikasi yang masih terbuka/);
    expect(doc).toMatch(/belum ditinjau oleh tenaga medis/);
  });
});
