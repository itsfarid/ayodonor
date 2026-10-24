// @vitest-environment jsdom
import fs from "fs";
import path from "path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allPagesText, renderPage } from "./helpers";
import { ROUTES } from "../src/routes";

const ROOT = path.join(__dirname, "..");

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("page structure and footer", () => {
  it("every in-page anchor on every page points at an element that exists", () => {
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      const hrefs = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")!.slice(1));
      for (const id of hrefs) expect(document.getElementById(id), `${r.path} -> #${id}`).not.toBeNull();
      unmount();
    }
  });

  it("every cross-page link with an #anchor points at an element that exists on that page", () => {
    const targets = new Map<string, Set<string>>();
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      targets.set(r.path, new Set([...container.querySelectorAll("[id]")].map((e) => e.id)));
      unmount();
    }
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      for (const a of container.querySelectorAll('a[href^="/"]')) {
        const [pathPart, hash] = a.getAttribute("href")!.split("#");
        expect(targets.has(pathPart || "/"), `${r.path}: unknown route ${pathPart}`).toBe(true);
        if (hash) expect(targets.get(pathPart || "/")!.has(hash), `${r.path}: ${pathPart}#${hash}`).toBe(true);
      }
      unmount();
    }
  });

  it("states independence from PMI/Kemenkes and the educational-only scope in the footer of every page", () => {
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      const footer = container.querySelector("footer")!.textContent!;
      expect(footer, r.path).toMatch(/tidak berafiliasi dengan PMI maupun Kemenkes/);
      expect(footer, r.path).toMatch(/bukan keputusan kelayakan/);
      unmount();
    }
    const { container } = renderPage("/");
    const footer = container.querySelector("footer")!.textContent!;
    expect(footer).toMatch(/tidak berafiliasi dengan PMI maupun Kemenkes/);
    expect(footer).toMatch(/bukan keputusan kelayakan/);
    expect(footer).toMatch(/bisa belum lengkap atau sudah berubah/);
    expect(footer).toMatch(/tidak menampilkan stok darah/);
  });

  it("has a privacy section on /tentang that matches the real (client-only) data flows", () => {
    const { container } = renderPage("/tentang");
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
  it("every page has a skip link, exactly one h1, a main landmark, and labelled navigation", () => {
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      expect(container.querySelector('a.skip-link[href="#konten"]'), r.path).not.toBeNull();
      expect(container.querySelector("main#konten"), r.path).not.toBeNull();
      expect(container.querySelectorAll("h1"), r.path).toHaveLength(1);
      for (const nav of container.querySelectorAll("nav")) expect(nav.getAttribute("aria-label"), `${r.path} ${nav.outerHTML.slice(0, 60)}`).toBeTruthy();
      unmount();
    }
  });

  it("headings never skip a level on any page", () => {
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      let prev = 0;
      for (const h of container.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
        const level = Number(h.tagName[1]);
        expect(level - prev, `${r.path}: ${h.textContent?.slice(0, 40)}`).toBeLessThanOrEqual(1);
        prev = level;
      }
      unmount();
    }
  });

  it("never nests interactive elements inside role=button and gives every button a name", () => {
    for (const r of ROUTES) {
      const { container, unmount } = renderPage(r.path);
      expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
      for (const b of container.querySelectorAll("button")) {
        expect((b.textContent ?? "").replace(/\s/g, "") || b.getAttribute("aria-label"), `${r.path} ${b.outerHTML.slice(0, 80)}`).toBeTruthy();
      }
      unmount();
    }
  });

  it("does not use emoji as interface decoration", () => {
    const text = allPagesText();
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe("no stale text about the removed demo locator", () => {
  it("the page and FAQ no longer call locations or stock 'demo', 'contoh' or unverified examples", () => {
    const text = allPagesText();
    expect(text).not.toMatch(/data demo|data contoh|contoh (lokasi|yang belum diverifikasi)|lokasi demo|status stok|stok.{0,20}fiktif/i);
    expect(text).toMatch(/disalin dari halaman Kontak PMI/);
  });
});

describe("Permenkes page references", () => {
  it("point at printed page numbers of the verified gazette copy and the source names that copy", async () => {
    const { SOURCES } = await import("../src/data/sources");
    const { FAQ_ITEMS } = await import("../src/data/faq");
    const permenkes = SOURCES.find((s) => s.id === "permenkes")!;
    expect(permenkes.readCopy?.url).toMatch(/^https:\/\/www\.kemhan\.go\.id\/.*bn36-2016\.pdf$/);
    expect(permenkes.limits).toMatch(/nomor cetak/);
    for (const item of FAQ_ITEMS) {
      for (const ref of item.refs.filter((r) => r.id === "permenkes" && r.locator)) {
        // Selection criteria and standards sit on printed pages 22-63 and the forms near 276; never page 0 or beyond the 289-page file.
        for (const n of ref.locator!.match(/\d+/g)!.map(Number)) {
          if (n !== 3 && n !== 2) expect(n, `${item.id}: ${ref.locator}`).toBeGreaterThan(20);
          expect(n).toBeLessThanOrEqual(289);
        }
      }
    }
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
