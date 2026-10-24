// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PmiLocator from "../src/components/PmiLocator";
import { UTD_RECORDS, UTD_RETRIEVED_ON, type UtdRecord } from "../src/data/utd";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => {
    throw new Error("no network calls expected");
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---- Geolocation test doubles (deterministic; the developer's real location is never used) ----
let getCurrentPosition: ReturnType<typeof vi.fn>;
function mockGeolocation(impl: (ok: (p: unknown) => void, fail: (e: unknown) => void) => void) {
  getCurrentPosition = vi.fn((ok, fail) => impl(ok, fail));
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
}
const at = (latitude: number, longitude: number, accuracy = 25) => mockGeolocation((ok) => ok({ coords: { latitude, longitude, accuracy } }));
const failWith = (code: number) => mockGeolocation((_ok, fail) => fail({ code }));
const click = async (el: HTMLElement) => act(async () => void fireEvent.click(el));

// Fixture units WITH coordinates. They are test data only; the shipped dataset has no coordinates.
const unit = (no: number, name: string, province: string, coordinates?: { lat: number; lng: number }): UtdRecord => ({
  no,
  name,
  province,
  address: `Jl. Uji No. ${no}`,
  phone: "(021) 555000",
  sourceUrl: "https://example.test/source",
  verifiedOn: "1 Januari 2026",
  coordinates: coordinates && { ...coordinates, source: "https://example.test/coords" },
});
const FIXTURES: UtdRecord[] = [
  unit(1, "Unit Tanpa Koordinat", "Provinsi X"),
  unit(2, "Unit Makassar", "Sulawesi Selatan", { lat: -5.1477, lng: 119.4327 }),
  unit(3, "Unit Jakarta", "DKI Jakarta", { lat: -6.1844, lng: 106.8444 }),
  unit(4, "Unit Surabaya", "Jawa Timur", { lat: -7.2651, lng: 112.7423 }),
  unit(5, "Unit Bandung", "Jawa Barat", { lat: -6.9103, lng: 107.6186 }),
];
const resultNames = () => within(screen.getByRole("list", { name: /hasil pencarian/i })).getAllByRole("listitem").map((li) => li.querySelector(".loc__name")!.textContent);
const search = (value: string) => fireEvent.change(screen.getByLabelText(/cari kota/i), { target: { value } });
const locateButton = () => screen.getByRole("button", { name: /gunakan posisiku|perbarui posisiku/i });

describe("shipped data (no coordinates)", () => {
  it("starts with an informative initial state and lists nothing until the user searches", () => {
    render(<PmiLocator />);
    expect(screen.getByText(/belum ada pencarian/i)).toBeTruthy();
    expect(screen.queryByRole("list", { name: /hasil pencarian/i })).toBeNull();
  });

  it("states where the data comes from, with date and link, and what it cannot promise", () => {
    const { container } = render(<PmiLocator />);
    const text = container.textContent!;
    expect(text).toContain(`${UTD_RECORDS.length} unit`);
    expect(text).toContain(UTD_RETRIEVED_ON);
    expect(text).toMatch(/belum lengkap atau sudah berubah/);
    expect(text).toMatch(/tidak mencantumkan jam layanan/);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://ayodonor.pmi.or.id/?page=kontak");
    expect(hrefs).toContain("https://ayodonor.pmi.or.id/?page=stok");
  });

  it("does not offer a location button or request the position, and says why distances are missing", () => {
    mockGeolocation(() => {});
    const { container } = render(<PmiLocator />);
    expect(screen.queryByRole("button", { name: /posisi/i })).toBeNull();
    expect(container.textContent).toMatch(/Jarak dari posisimu belum ditampilkan/);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("finds units by city (manual search) and shows the official address and phone", () => {
    render(<PmiLocator />);
    search("makassar");
    expect(resultNames()).toContain("UDD PMI Kota Makassar");
    const item = screen.getByText("UDD PMI Kota Makassar").closest("li")!;
    expect(item.textContent).toContain("Jl. Lanto Daeng Pasewang No. 55 Makassar");
    expect(item.textContent).toContain("(0411) 852477");
    expect(item.textContent).not.toMatch(/km|jarak/i);
  });

  it("matches every word of the query across name, province and address, case-insensitively", () => {
    render(<PmiLocator />);
    search("KOTA  bandung");
    expect(resultNames()).toContain("UDD PMI Kota Bandung");
    expect(resultNames()).not.toContain("UDD PMI Kota Makassar");
  });

  it("ranks name/province matches above address-only matches (\"jawa timur\" must not lead with a Central Java address)", () => {
    render(<PmiLocator />);
    search("jawa timur");
    const firstItems = within(screen.getByRole("list", { name: /hasil pencarian/i })).getAllByRole("listitem").slice(0, 20);
    for (const li of firstItems) expect(li.querySelector(".loc__meta")!.textContent).toBe("Jawa Timur");
  });

  it("filters by province and combines it with the text search", () => {
    render(<PmiLocator />);
    fireEvent.change(screen.getByLabelText(/^provinsi$/i), { target: { value: "Bali" } });
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    for (const li of within(screen.getByRole("list", { name: /hasil pencarian/i })).getAllByRole("listitem")) {
      expect(li.textContent).toContain("Bali");
    }
    search("zzzz");
    expect(screen.getByText(/tidak ada hasil/i)).toBeTruthy();
  });

  it("explains an empty result and offers practical next steps, without falling back to another place", () => {
    const { container } = render(<PmiLocator />);
    search("tidak-ada-kota-ini");
    expect(screen.getByText("Tidak ada hasil")).toBeTruthy();
    expect(container.textContent).toMatch(/belum tentu berarti tidak ada unit/);
    expect(screen.queryByRole("list", { name: /hasil pencarian/i })).toBeNull();
    const next = screen.getByRole("link", { name: /halaman kontak pmi/i });
    expect(next.getAttribute("href")).toBe("https://ayodonor.pmi.or.id/?page=kontak");
    fireEvent.click(screen.getByRole("button", { name: /hapus pencarian/i }));
    expect(screen.getByText(/belum ada pencarian/i)).toBeTruthy();
  });

  it("pages long results instead of rendering them all at once", () => {
    render(<PmiLocator />);
    fireEvent.change(screen.getByLabelText(/^provinsi$/i), { target: { value: "Jawa Timur" } });
    expect(resultNames().length).toBe(20);
    fireEvent.click(screen.getByRole("button", { name: /tampilkan lebih banyak/i }));
    expect(resultNames().length).toBe(37);
  });

  it("makes a phone link only for a single number, and says when the source lists none", () => {
    render(<PmiLocator />);
    search("Kota Bandung");
    const bandung = screen.getByText("UDD PMI Kota Bandung").closest("li")!;
    expect(bandung.querySelector('a[href="tel:0224207052"]')).not.toBeNull();
    cleanup();
    render(<PmiLocator />);
    search("Provinsi DKI Jakarta"); // "(021) 906666/327711": two numbers, so plain text
    const dki = screen.getByText("UDD PMI Provinsi DKI Jakarta").closest("li")!;
    expect(dki.querySelector('a[href^="tel:"]')).toBeNull();
    expect(dki.textContent).toContain("(021) 906666/327711");
    cleanup();
    render(<PmiLocator />);
    search("Jakarta Pusat");
    expect(screen.getByText("UDD PMI Kota Jakarta Pusat").closest("li")!.textContent).toContain("Tidak tercantum di sumber");
  });
});

describe("no fabricated stock or demo data", () => {
  it("shows no stock labels in any state, and tells the reader stock is not shown", () => {
    const { container } = render(<PmiLocator units={FIXTURES} />);
    const check = () => {
      const text = container.textContent!;
      expect(text).not.toMatch(/\b(Aman|Cukup|Kritis)\b/);
      expect(text).not.toMatch(/Gol (A|B|O|AB)\b/);
      expect(text).not.toMatch(/fiktif|ilustrasi demo|data demo|contoh lokasi/i);
    };
    check();
    search("unit");
    check();
    search("tidak-ada");
    check();
    expect(container.textContent).toMatch(/tidak menampilkan stok darah/);
  });

  it("does not show distant or unrelated units as a fallback", () => {
    render(<PmiLocator />);
    search("Jayapura");
    for (const name of resultNames()) expect(name).toMatch(/Jayapura|Papua/i);
  });
});

describe("with sourced coordinates: location flow", () => {
  it("does not ask for the position on load or on search; only on the button", async () => {
    at(-6.9, 107.6);
    render(<PmiLocator units={FIXTURES} />);
    search("unit");
    expect(getCurrentPosition).not.toHaveBeenCalled();
    await click(locateButton());
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("success: sorts by ascending distance, labels distances as estimates, and never says 'terdekat'", async () => {
    at(-6.9, 107.6); // near Bandung
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(resultNames()).toEqual(["Unit Bandung", "Unit Jakarta", "Unit Surabaya", "Unit Makassar", "Unit Tanpa Koordinat"]);
    const dists = [...container.querySelectorAll(".loc__dist")].map((d) => d.textContent!);
    expect(dists).toHaveLength(4);
    for (const d of dists) expect(d).toMatch(/Perkiraan jarak garis lurus: ≈ /);
    const km = dists.map((d) => Number(d.match(/≈ ([\d.]+) km/)![1]));
    expect([...km].sort((a, b) => a - b)).toEqual(km);
    expect(container.textContent).toMatch(/perkiraan.*jarak garis lurus.*bukan jarak tempuh/i);
    expect(container.textContent).not.toMatch(/terdekat/i);
    expect(container.textContent).toMatch(/4 dari 5 unit yang punya koordinat/);
  });

  it("uses coordinates in the right order: a position in Makassar ranks the Makassar unit first", async () => {
    at(-5.15, 119.43);
    render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(resultNames()[0]).toBe("Unit Makassar");
  });

  it("warns that a coarse fix can be far off", async () => {
    at(-6.9, 107.6, 80_000);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(container.textContent).toMatch(/Posisi ini kasar/);
  });

  it("manual search still works while the position is known, and keeps distance order inside the matches", async () => {
    at(-6.9, 107.6);
    render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    fireEvent.change(screen.getByLabelText(/^provinsi$/i), { target: { value: "Jawa Timur" } });
    expect(resultNames()).toEqual(["Unit Surabaya"]);
  });

  it.each([
    [1, /izin lokasi ditolak/i],
    [2, /posisi tidak tersedia/i],
    [3, /tidak ditemukan tepat waktu/i],
  ])("failure code %i shows its own honest message, no distances, and a retry", async (code, message) => {
    failWith(code);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(message);
    expect(container.querySelectorAll(".loc__dist")).toHaveLength(0);
    expect(screen.queryByText(/posisi diterima/i)).toBeNull();
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeTruthy();
    search("unit"); // manual search remains available
    expect(resultNames().length).toBe(5);
  });

  it("unsupported browser: explains it and offers no retry", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
    render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(screen.getByRole("alert").textContent).toMatch(/tidak mendukung lokasi/i);
    expect(screen.queryByRole("button", { name: /coba lagi/i })).toBeNull();
  });

  it.each([
    ["swapped", 106.8444, -6.1844],
    ["out of range", 123, 456],
    ["NaN", NaN, NaN],
  ])("invalid coordinates (%s) are rejected, not used", async (_l, lat, lng) => {
    at(lat, lng);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(screen.getByRole("alert").textContent).toMatch(/koordinat yang tidak valid/i);
    expect(container.querySelectorAll(".loc__dist")).toHaveLength(0);
  });

  it("a failed retry removes the earlier position instead of leaving stale distances", async () => {
    at(-6.9, 107.6);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    expect(container.querySelectorAll(".loc__dist").length).toBeGreaterThan(0);
    failWith(3);
    await click(screen.getByRole("button", { name: /perbarui posisiku/i }));
    expect(container.querySelectorAll(".loc__dist")).toHaveLength(0);
    expect(screen.getByRole("alert").textContent).toMatch(/tepat waktu/);
    // retry succeeds and recovers
    at(-7.26, 112.74);
    await click(screen.getByRole("button", { name: /coba lagi/i }));
    expect(resultNames()[0]).toBe("Unit Surabaya");
  });

  it("shows a loading state while waiting, with the button disabled", async () => {
    let finish: (p: unknown) => void = () => {};
    mockGeolocation((ok) => {
      finish = ok;
    });
    render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    const busy = screen.getByRole("button", { name: /mencari posisimu/i }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(screen.getByText(/menunggu browser/i)).toBeTruthy();
    await act(async () => finish({ coords: { latitude: -6.9, longitude: 107.6, accuracy: 10 } }));
    expect(screen.getByText(/posisi diterima/i)).toBeTruthy();
  });

  it("'Hapus posisi' returns to the neutral state", async () => {
    at(-6.9, 107.6);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    await click(locateButton());
    fireEvent.click(screen.getByRole("button", { name: /hapus posisi/i }));
    expect(container.querySelectorAll(".loc__dist")).toHaveLength(0);
    expect(screen.getByText(/belum ada pencarian/i)).toBeTruthy();
  });

  it("never sends the position anywhere or puts it in a link", async () => {
    at(-6.9123, 107.6234);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    const errors = vi.spyOn(console, "error");
    const logs = vi.spyOn(console, "log");
    await click(locateButton());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(logs).not.toHaveBeenCalled();
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("href")).not.toMatch(/6\.9123|107\.6234/);
    }
    expect(container.textContent).toMatch(/tidak dikirim ke server/);
  });
});

describe("accessibility", () => {
  it("labels both search controls and gives every button and link an accessible name", () => {
    const { container } = render(<PmiLocator units={FIXTURES} />);
    search("unit");
    expect(screen.getByLabelText(/cari kota/i)).toBeTruthy();
    expect(screen.getByLabelText(/^provinsi$/i)).toBeTruthy();
    for (const el of container.querySelectorAll("button, a, select, input")) {
      const name = (el.textContent ?? "").trim() || el.getAttribute("aria-label") || (el as HTMLInputElement).labels?.[0]?.textContent;
      expect(name, el.outerHTML.slice(0, 80)).toBeTruthy();
    }
  });

  it("renders results as a semantic list and uses no role=button wrappers", () => {
    const { container } = render(<PmiLocator units={FIXTURES} />);
    search("unit");
    expect(screen.getByRole("list", { name: /hasil pencarian/i }).tagName).toBe("UL");
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it("opens external links safely and announces the new tab", () => {
    const { container } = render(<PmiLocator units={FIXTURES} />);
    search("unit");
    const external = [...container.querySelectorAll('a[target="_blank"]')];
    expect(external.length).toBeGreaterThan(2);
    for (const a of external) {
      expect(a.getAttribute("rel")).toContain("noopener");
      expect(a.textContent).toMatch(/membuka tab baru|ayodonor\.pmi\.or\.id|Sumber|PMI|Kontak|Stok/i);
    }
    const maps = container.querySelector('a[href^="https://www.google.com/maps/search/"]')!;
    expect(decodeURIComponent(maps.getAttribute("href")!)).toContain("Unit");
  });

  it("announces status changes and errors through live regions or alert roles", async () => {
    failWith(1);
    const { container } = render(<PmiLocator units={FIXTURES} />);
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
    await click(locateButton());
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
