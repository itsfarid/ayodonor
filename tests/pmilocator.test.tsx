// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PmiLocator, { getDistanceKm, INITIAL_PMI_DATA } from "../src/components/PmiLocator";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockGeolocation(impl: (ok: (p: any) => void, fail: (e: any) => void) => void) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: (ok: any, fail: any) => impl(ok, fail) },
  });
}
const at = (latitude: number, longitude: number) => mockGeolocation((ok) => ok({ coords: { latitude, longitude } }));

describe("PmiLocator labelling", () => {
  it("never presents demo data as official, live or verified", () => {
    const { container } = render(<PmiLocator />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/belum diverifikasi/i);
    expect(text).toMatch(/fiktif/i);
    for (const banned of [/real-?time/i, /kontak resmi/i, /cek stok darah/i, /sentinel/i, /buka 24 jam/i, /tactical/i]) {
      expect(text).not.toMatch(banned);
    }
  });

  it("marks every location's stock status as fictional", () => {
    const { container } = render(<PmiLocator />);
    const labels = container.textContent!.match(/Contoh status stok \(fiktif\)/g) ?? [];
    expect(labels.length).toBeGreaterThanOrEqual(INITIAL_PMI_DATA.length);
  });

  it("points to the official PMI portal for real stock and locations", () => {
    render(<PmiLocator />);
    const link = screen.getAllByText("ayodonor.pmi.or.id")[0].closest("a")!;
    expect(link.getAttribute("href")).toBe("https://ayodonor.pmi.or.id");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("lets keyboard users select a location card", () => {
    render(<PmiLocator />);
    const card = screen.getByRole("button", { name: `Pilih ${INITIAL_PMI_DATA[1].name}` });
    expect(card.getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(card.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("PmiLocator geolocation behaviour", () => {
  it("warns when the nearest demo location is far away", async () => {
    at(-2.53, 140.7); // Jayapura
    render(<PmiLocator />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /urutkan contoh lokasi/i })));
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/hanya memuat 7 kota/);
    const km = Number(alert.textContent!.match(/sekitar ([\d.]+) km/)![1].replace(/\./g, ""));
    expect(km).toBeGreaterThan(2000);
  });

  it("shows no warning near a demo location and sorts by straight-line distance", async () => {
    at(-6.9, 107.6); // near Bandung
    const { container } = render(<PmiLocator />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /urutkan contoh lokasi/i })));
    expect(screen.queryByRole("alert")).toBeNull();
    const firstCard = container.querySelector('[role="button"][aria-label^="Pilih "]')!;
    expect(firstCard.getAttribute("aria-label")).toBe("Pilih UDD PMI Kota Bandung");
    expect(container.textContent).toMatch(/garis lurus/);
  });

  it("reports a permission-denied error without crashing", async () => {
    mockGeolocation((_ok, fail) => fail({ code: 1, PERMISSION_DENIED: 1 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<PmiLocator />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /urutkan contoh lokasi/i })));
    expect(screen.getByText(/akses lokasi ditolak/i)).toBeTruthy();
  });

  it("states that the location is not sent to a server", async () => {
    at(-6.2, 106.8);
    const { container } = render(<PmiLocator />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /urutkan contoh lokasi/i })));
    expect(container.textContent).toMatch(/tidak dikirim ke server/);
  });
});

describe("getDistanceKm (Haversine)", () => {
  it("matches known city distances", () => {
    expect(getDistanceKm(-6.1844, 106.8444, -6.9103, 107.6186)).toBeCloseTo(117.6, 0);
    expect(getDistanceKm(-6.1844, 106.8444, -7.2651, 112.7423)).toBeCloseTo(662.3, 0);
    expect(getDistanceKm(1, 1, 1, 1)).toBe(0);
  });
});
