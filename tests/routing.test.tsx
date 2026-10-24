// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { Link, Router } from "../src/router";
import { canonicalUrl, findRoute, normalizePath, NOT_FOUND_META, ROUTES } from "../src/routes";
import { renderPage } from "./helpers";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.history.replaceState({}, "", "/");
});
afterEach(cleanup);

describe("route table", () => {
  it("defines exactly the five required routes with unique paths, titles and descriptions", () => {
    expect(ROUTES.map((r) => r.path)).toEqual(["/", "/panduan", "/fakta-mitos", "/lokasi", "/tentang"]);
    expect(new Set(ROUTES.map((r) => r.title)).size).toBe(5);
    expect(new Set(ROUTES.map((r) => r.description)).size).toBe(5);
    for (const r of ROUTES) {
      expect(r.title.length, r.path).toBeGreaterThan(10);
      expect(r.description.length, r.path).toBeGreaterThan(60);
      expect(r.description.length, r.path).toBeLessThan(320);
      // Same safety framing as the rest of the site: never implies a medical service or PMI affiliation.
      expect(`${r.title} ${r.description}`, r.path).not.toMatch(/cek kelayakan|resmi dari PMI|dijamin|100\s?%/i);
    }
  });

  it("normalises trailing slashes, .html and query/hash, and rejects unknown paths", () => {
    expect(normalizePath("/panduan/")).toBe("/panduan");
    expect(normalizePath("/panduan.html")).toBe("/panduan");
    expect(normalizePath("/index.html")).toBe("/");
    expect(normalizePath("/lokasi?q=bandung#hasil")).toBe("/lokasi");
    expect(normalizePath("")).toBe("/");
    expect(findRoute("/fakta-mitos/")?.label).toBe("Fakta & Mitos");
    expect(findRoute("/admin")).toBeUndefined();
    expect(canonicalUrl("/")).toBe("https://ayodonor.web.id/");
    expect(canonicalUrl("/tentang")).toBe("https://ayodonor.web.id/tentang");
  });
});

describe("pages", () => {
  it.each(ROUTES.map((r) => [r.path, r.label] as const))("%s renders its own page with one h1 and sets the document title", (path) => {
    const route = findRoute(path)!;
    renderPage(path);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(route.title);
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull(); // test document has no head template; title is what matters here
  });

  it("an unknown address shows the not-found page and a noindex-safe title", () => {
    render(<App path="/tidak-ada" />);
    expect(screen.getByRole("heading", { level: 1, name: /tidak ditemukan/i })).toBeTruthy();
    expect(document.title).toBe(NOT_FOUND_META.title);
    expect(screen.getByRole("link", { name: /^ke beranda$/i }).getAttribute("href")).toBe("/");
  });

  it("the home page is concise: previews only, no FAQ, quiz, source table or location dataset", () => {
    const { container } = renderPage("/");
    expect(container.querySelector("#faq-section")).toBeNull();
    expect(container.querySelector("#quiz-section")).toBeNull();
    expect(container.querySelector("#sumber-informasi")).toBeNull();
    expect(container.querySelector("#pmi-locator")).toBeNull();
    expect(container.querySelectorAll("details")).toHaveLength(0);
    expect(container.querySelectorAll("table")).toHaveLength(0);
    expect((container.textContent ?? "").length).toBeLessThan(5000);
    // primary action and the three previews link onward
    const hrefs = [...container.querySelectorAll("main a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/lokasi");
    expect(hrefs).toContain("/panduan");
    expect(hrefs).toContain("/fakta-mitos");
  });

  it("the guide holds eligibility, preparation, process, aftercare, quiz and FAQ, each with its sources", () => {
    const { container } = renderPage("/panduan");
    for (const id of ["syarat", "persiapan", "proses", "setelah", "quiz-section", "faq-section", "content-personal", "content-sosial", "content-kesehatan"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
    }
    expect(container.querySelectorAll("#faq-section details").length).toBeGreaterThanOrEqual(15);
    expect(container.querySelector("#persiapan")!.querySelector('a[href^="https://ayodonor.pmi.or.id"]')).not.toBeNull();
  });

  it("facts and myths holds the three facts, the three myths and related FAQ entries", () => {
    const { container } = renderPage("/fakta-mitos");
    expect(container.querySelectorAll("#sekilas .glance__item")).toHaveLength(3);
    expect(container.querySelectorAll("#mitos-fakta dt")).toHaveLength(3);
    expect(container.querySelectorAll("#pertanyaan-terkait details").length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).toMatch(/Donor darah bukan program diet/);
  });

  it("the location page keeps the whole dataset searchable and the contact guidance", () => {
    const { container } = renderPage("/lokasi");
    expect(container.querySelector("#pmi-locator")).not.toBeNull();
    expect(container.querySelector("#hubungi")).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/cari kota/i), { target: { value: "makassar" } });
    expect(container.textContent).toContain("UDD PMI Kota Makassar");
  });

  it("About holds the purpose, every source with its limits, the comparison table and the privacy summary", () => {
    const { container } = renderPage("/tentang");
    for (const id of ["tentang-ayodonor", "sumber-informasi", "perbedaan-sumber", "privasi"]) expect(container.querySelector(`#${id}`), id).not.toBeNull();
    expect(container.querySelectorAll("#sumber-informasi li.ref").length).toBeGreaterThanOrEqual(10);
    expect(container.querySelectorAll("#sumber-informasi table").length).toBe(1);
  });
});

describe("navigation", () => {
  const menu = () => screen.getByRole("navigation", { name: /navigasi utama/i });

  it("lists the five pages and marks the current one", () => {
    renderPage("/lokasi");
    const links = within(menu()).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(ROUTES.map((r) => r.path));
    expect(links.filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.getAttribute("href"))).toEqual(["/lokasi"]);
  });

  it("clicking a link changes page and URL without a reload, updates the title, resets scroll and focuses the content", () => {
    renderPage("/");
    fireEvent.click(within(menu()).getByRole("link", { name: "Panduan" }));
    expect(window.location.pathname).toBe("/panduan");
    expect(document.title).toBe(findRoute("/panduan")!.title);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Panduan donor darah/);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(document.activeElement?.id).toBe("konten");
    expect(within(menu()).getByRole("link", { name: "Panduan" }).getAttribute("aria-current")).toBe("page");
  });

  it("modified clicks (new tab, copy link) are left to the browser", () => {
    renderPage("/");
    const link = within(menu()).getByRole("link", { name: "Lokasi" });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { shiftKey: true });
    expect(window.location.pathname).toBe("/");
  });

  it("the browser back button returns to the previous page", async () => {
    renderPage("/");
    fireEvent.click(within(menu()).getByRole("link", { name: "Tentang" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Tentang AyoDonor/);
    await act(async () => {
      window.history.back();
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(window.location.pathname).toBe("/");
    expect(document.title).toBe(findRoute("/")!.title);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Pahami donor darah/);
  });

  it("a cross-page link with an #anchor scrolls to that anchor after the new page renders", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderPage("/fakta-mitos");
    fireEvent.click(screen.getAllByRole("link", { name: /sumber informasi/i }).find((a) => a.getAttribute("href") === "/tentang#sumber-informasi")!);
    expect(window.location.pathname).toBe("/tentang");
    expect(window.location.hash).toBe("#sumber-informasi");
    expect(scroll).toHaveBeenCalled();
    expect((scroll.mock.instances.at(-1) as Element).id).toBe("sumber-informasi");
  });

  it("a link to an anchor on the same page scrolls to it and keeps the page as it is", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(
      <Router initialPath="/panduan">
        <Link to="/panduan#faq-section">ke tanya jawab</Link>
        <div id="faq-section" />
      </Router>
    );
    fireEvent.click(screen.getByRole("link", { name: "ke tanya jawab" }));
    expect(window.location.pathname + window.location.hash).toBe("/panduan#faq-section");
    expect((scroll.mock.instances.at(-1) as Element).id).toBe("faq-section");
  });

  it("starts at the #anchor of the address on first load", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    window.history.replaceState({}, "", "/panduan#faq-section");
    render(<App />);
    expect((scroll.mock.instances.at(-1) as Element).id).toBe("faq-section");
  });

  it("the first navigation after loading on an #anchor still returns to the top of the new page", () => {
    window.history.replaceState({}, "", "/panduan#faq-section");
    render(<App />);
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(within(screen.getByRole("navigation", { name: /navigasi utama/i })).getByRole("link", { name: "Lokasi" }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(document.activeElement?.id).toBe("konten");
  });

  it("reads the page from the browser address when no path is given", () => {
    window.history.replaceState({}, "", "/fakta-mitos/");
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Fakta dan mitos/);
  });
});

describe("mobile menu", () => {
  const toggle = () => screen.getByRole("button", { name: /menu/i });

  it("is closed by default, opens and closes with the button, and exposes its state", () => {
    renderPage("/");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(toggle().getAttribute("aria-controls")).toBe("site-nav");
    expect(document.getElementById("site-nav")!.getAttribute("data-open")).toBe("false");
    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("site-nav")!.getAttribute("data-open")).toBe("true");
    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape (focus returns to the button) and after choosing a page", () => {
    renderPage("/");
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle());
    fireEvent.click(toggle());
    fireEvent.click(within(screen.getByRole("navigation", { name: /navigasi utama/i })).getByRole("link", { name: "Lokasi" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });
});
