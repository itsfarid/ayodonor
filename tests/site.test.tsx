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
    expect(footer).toMatch(/belum diverifikasi/);
    expect(footer).toMatch(/Jawaban AI bisa keliru/);
  });

  it("has a privacy section describing the real data flows", () => {
    const { container } = render(<App />);
    const privacy = container.querySelector("#privasi")!.textContent!;
    expect(privacy).toMatch(/dikirim ke server/);
    expect(privacy).toMatch(/Google Gemini/);
    expect(privacy).toMatch(/tidak dikirim ke server/); // location
    expect(privacy).toMatch(/Google Fonts/);
    expect(privacy).not.toMatch(/tetap di perangkat|tidak pernah (dikirim|meninggalkan)/i);
  });
});

describe("index.html metadata", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  it("does not promise eligibility checks, official status or an image that does not exist", () => {
    expect(html).not.toMatch(/cek kelayakan|resmi dari PMI|summary_large_image|og:image/i);
    expect(html).toMatch(/tidak berafiliasi dengan PMI/);
  });

  it("references a favicon that actually exists", () => {
    expect(html).toContain('href="/favicon.svg"');
    expect(fs.existsSync(path.join(ROOT, "public", "favicon.svg"))).toBe(true);
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
