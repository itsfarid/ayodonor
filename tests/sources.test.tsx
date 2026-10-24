// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allPagesText, renderPage } from "./helpers";
import { Router } from "../src/router";
import Faq from "../src/components/Faq";
import { CRITERIA_COMPARISON, getSource, SOURCES } from "../src/data/sources";
import { FAQ_ITEMS } from "../src/data/faq";
import fs from "fs";
import path from "path";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

// The six references requested for the audit.
const REQUIRED_URLS = [
  "https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-91-tahun-2015",
  "https://ayodonor.pmi.or.id/?page=faq",
  "https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability",
  "https://www.who.int/publications/i/item/blood-donor-selection-guidelines-on-assessing-donor-suitability-for-blood-donation",
  "https://www.who.int/campaigns/world-blood-donor-day/who-can-give-blood",
  "https://keslan.kemkes.go.id/view_artikel/2637/apa-saja-keuntungan-donor-darah-yuk-kita-cek",
];

describe("source data", () => {
  it("includes every required reference exactly once", () => {
    for (const url of REQUIRED_URLS) expect(SOURCES.filter((s) => s.url === url), url).toHaveLength(1);
  });

  it("has unique ids, https URLs, an access date, a publication note, support and limits", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      expect(s.url, s.id).toMatch(/^https:\/\//);
      expect(s.accessed, s.id).toMatch(/\d{1,2} \w+ 20\d\d/);
      for (const field of [s.title, s.publisher, s.published, s.supports, s.limits, s.label]) expect(field.trim().length, s.id).toBeGreaterThan(5);
    }
  });

  it("uses the Permenkes as the Indonesian regulation reference and WHO as general guidance", () => {
    expect(getSource("permenkes").kind).toBe("Regulasi Indonesia");
    expect(getSource("who-safety").kind).toBe("Pedoman internasional");
    expect(getSource("pmi-faq").kind).toBe("Panduan praktis PMI");
  });

  it("does not pretend the sources agree: key criteria are compared side by side", () => {
    const row = (name: string) => CRITERIA_COMPARISON.find((r) => r.criterion === name)!;
    expect(row("Jeda antar donor darah lengkap").permenkes).toMatch(/2 bulan/);
    expect(row("Jeda antar donor darah lengkap").kemkes).toMatch(/3 bulan/);
    expect(row("Tato, tindik, akupunktur").pmi).toMatch(/1 tahun/);
    expect(row("Tato, tindik, akupunktur").who).toMatch(/6 bulan/);
    expect(row("Berat badan").who).toMatch(/50 kg/);
    expect(row("Haid").permenkes).toMatch(/Tidak disebut/);
  });
});

describe("Sumber informasi section", () => {
  it("is present and headed on /tentang, and linked from the header menu, footer, FAQ and guide", () => {
    const { container } = renderPage("/tentang");
    const section = container.querySelector("#sumber-informasi")!;
    expect(section).not.toBeNull();
    expect(section.querySelector("h2")?.textContent).toMatch(/Sumber informasi/);
    expect(container.querySelector('header a[href="/tentang"]')).not.toBeNull();
    expect(container.querySelector('footer a[href="/tentang#sumber-informasi"]')).not.toBeNull();
    cleanup();
    const guide = renderPage("/panduan").container;
    expect(guide.querySelectorAll('a[href="/tentang#sumber-informasi"]').length).toBeGreaterThanOrEqual(2); // FAQ intro + chapter note + footer
  });

  it("lists every source as an external link with safe attributes and full metadata", () => {
    const { container } = renderPage("/tentang");
    const section = container.querySelector("#sumber-informasi")!;
    for (const s of SOURCES) {
      const item = section.querySelector(`#sumber-${s.id}`)!;
      const link = item.querySelector("a")!;
      expect(link.getAttribute("href")).toBe(s.url);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(item.textContent).toContain(s.publisher);
      expect(item.textContent).toContain(s.accessed);
      expect(item.textContent).toContain("Keterbatasan");
    }
  });

  it("is keyboard accessible: links are focusable, the table scrolls by keyboard and has headers", () => {
    const { container } = renderPage("/tentang");
    const section = container.querySelector("#sumber-informasi") as HTMLElement;
    for (const a of section.querySelectorAll("a")) {
      expect(a.getAttribute("tabindex")).not.toBe("-1");
      (a as HTMLElement).focus();
      expect(document.activeElement).toBe(a);
    }
    const region = section.querySelector('[role="region"]') as HTMLElement;
    expect(region.tabIndex).toBe(0);
    expect(region.getAttribute("aria-label")).toMatch(/perbedaan/i);
    expect(section.querySelector("table caption")).not.toBeNull();
    expect(section.querySelectorAll('th[scope="col"]').length).toBe(5);
    expect(section.querySelectorAll('th[scope="row"]').length).toBe(CRITERIA_COMPARISON.length);
  });

  it("states that the UTD officer decides and never claims medical or PMI approval", () => {
    const text = allPagesText();
    expect(text).toMatch(/petugas UTD yang memutuskan/);
    expect(text).not.toMatch(/(?<!belum )ditinjau oleh (tenaga medis|dokter|ahli|PMI)|telah ditinjau|disetujui (oleh )?(PMI|Kemenkes)|bersertifikat/i);
  });

  it("explains that benefit claims from the Kemenkes articles are not repeated", () => {
    const { container } = renderPage("/tentang");
    const text = container.querySelector("#sumber-informasi")!.textContent!;
    expect(text).toMatch(/tidak menjanjikan manfaat kesehatan pribadi/);
  });
});

describe("contextual source links", () => {
  it("every FAQ item renders a link for each of its source references", () => {
    const { container } = render(<Router initialPath="/panduan"><Faq /></Router>);
    const items = container.querySelectorAll("details");
    expect(items.length).toBe(FAQ_ITEMS.length);
    FAQ_ITEMS.forEach((item, i) => {
      const links = [...items[i].querySelectorAll("a")].map((a) => a.getAttribute("href"));
      expect(links, item.id).toEqual(item.refs.map((r) => getSource(r.id).url));
    });
  });

  it("every reference resolves to a known source and locators look like page citations", () => {
    for (const item of FAQ_ITEMS) {
      for (const ref of item.refs) {
        expect(() => getSource(ref.id), `${item.id}:${ref.id}`).not.toThrow();
        if (ref.locator) expect(ref.locator, item.id).toMatch(/hal\.|formulir/);
      }
    }
  });

  it("education panels, stats and footer link to their sources", () => {
    const { container } = renderPage("/panduan");
    const home = renderPage("/").container;
    const hrefs = (root: Element | null) => [...(root?.querySelectorAll("a") ?? [])].map((a) => a.getAttribute("href"));
    expect(hrefs(container.querySelector("#content-kesehatan"))).toContain(getSource("permenkes").url);
    expect(hrefs(container.querySelector("#content-kesehatan"))).toContain(getSource("pmi-faq").url);
    expect(hrefs(container.querySelector("footer"))).toContain(getSource("permenkes").url);
    const stats = home.querySelector("#sekilas")!;
    expect(hrefs(stats)).toContain(getSource("kemkes-pers").url);
    // All three chapters are rendered at once (no tabs hide content), each with its own sources.
    expect(hrefs(container.querySelector("#content-sosial"))).toContain(getSource("who-safety").url);
    expect(hrefs(container.querySelector("#content-personal"))).toContain(getSource("permenkes").url);
  });

  it("the quiz result carries source links and the not-a-substitute statement", () => {
    const { container } = renderPage("/panduan");
    fireEvent.change(screen.getByLabelText(/nama panggilan/i), { target: { value: "Uji" } });
    fireEvent.click(screen.getByRole("button", { name: /mulai kuis/i }));
    ["q1", "q2", "q3", "q4"].forEach((id) => fireEvent.click(document.getElementById(`btn-${id}-safe`)!));
    const results = container.querySelector("#quiz-results")!;
    expect(results.textContent).toMatch(/tidak menggantikan penilaian petugas UTD/);
    expect([...results.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toContain(getSource("permenkes").url);
  });
});

describe("claims that must stay out", () => {
  it("no displayed page restores benefit claims, certificates or 'real' PMI data", () => {
    // Sentences that explicitly deny or decline to repeat a claim are fine; only positive claims count.
    const text = allPagesText().replace(/[^.]*tidak (mengklaim|menjanjikan|kami ulang|mengulang)[^.]*\./gi, "");
    expect(text).not.toMatch(/menurunkan kolesterol|mencegah kanker|mencegah penyakit jantung|kulit cerah|membakar kalori|menambah stamina|meningkatkan stamina/i);
    expect(text).not.toMatch(/sertifikat kelayakan|100\s?%\s?lolos|real-?time|kontak resmi/i);
    expect(text).toMatch(/bisa belum lengkap atau sudah berubah/);
  });
});

describe("docs/medical-claims.md stays in sync with the app", () => {
  const doc = fs.readFileSync(path.join(__dirname, "..", "docs", "medical-claims.md"), "utf8");

  it("records every source URL, the access date and the review status", () => {
    for (const s of SOURCES) expect(doc, s.id).toContain(s.url);
    expect(doc).toContain("24 Oktober 2026");
    expect(doc).toMatch(/belum ditinjau oleh tenaga medis atau pihak PMI/);
    expect(doc).toMatch(/Celah verifikasi yang masih terbuka/);
  });

  it("covers every FAQ topic's sources and the unresolved differences", () => {
    for (const keyword of ["Usia", "Berat badan", "Hb", "Tekanan darah", "Jeda donor", "Tato/tindik", "Hamil/menyusui", "Demam/flu", "Haid"]) {
      expect(doc, keyword).toContain(keyword);
    }
    expect(CRITERIA_COMPARISON).toHaveLength(9);
    expect(doc).toMatch(/Perbedaan antar sumber yang belum terselesaikan/);
  });

  it("documents the locator audit: removed demo data, official source, and the missing coordinates", () => {
    expect(doc).toContain("https://ayodonor.pmi.or.id/?page=kontak");
    expect(doc).toMatch(/dihapus/);
    expect(doc).toMatch(/Koordinat: \*\*tidak ada\*\*/);
    const audit = fs.readFileSync(path.join(__dirname, "..", "docs", "locator-audit.md"), "utf8");
    expect(audit).toMatch(/Akar masalah yang terkonfirmasi/);
    expect(audit).toMatch(/bukan\*\* penyebabnya/);
  });
});
