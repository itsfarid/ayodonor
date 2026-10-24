// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Faq from "../src/components/Faq";
import { FAQ_ITEMS, searchFaq } from "../src/data/faq";

afterEach(cleanup);

describe("FAQ data", () => {
  it("cites a source (or honestly labels general advice) and makes no clearance or benefit claims", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(15);
    for (const item of FAQ_ITEMS) {
      expect(item.refs.length > 0 || Boolean(item.note), item.id).toBe(true);
      const text = `${item.question} ${item.answer}`;
      expect(text, item.id).not.toMatch(/\blolos\b|100\s?%|sertifikat|pasti boleh|kulit cerah|stamina/i);
      // Benefit topics may appear only as an explicit "we do not repeat this" statement.
      if (/kolesterol|kalori/i.test(text)) expect(text, item.id).toMatch(/tidak (menjanjikan|mengulang)|tanpa rujukan/i);
    }
    expect(new Set(FAQ_ITEMS.map((i) => i.id)).size).toBe(FAQ_ITEMS.length);
  });

  it("states disagreement between sources instead of picking a number", () => {
    const get = (id: string) => FAQ_ITEMS.find((i) => i.id === id)!.answer;
    expect(get("jeda")).toMatch(/2 bulan/);
    expect(get("jeda")).toMatch(/3 bulan/);
    expect(get("tato")).toMatch(/1 tahun/);
    expect(get("tato")).toMatch(/6 bulan/);
    expect(get("berat")).toMatch(/45 kg/);
    expect(get("berat")).toMatch(/50 kg/);
    expect(get("haid")).toMatch(/tidak ada di kriteria seleksi donor Permenkes/);
  });

  it("searches case-insensitively over questions and answers", () => {
    expect(searchFaq(FAQ_ITEMS, "TATO").map((i) => i.id)).toContain("tato");
    expect(searchFaq(FAQ_ITEMS, "  ").length).toBe(FAQ_ITEMS.length);
    expect(searchFaq(FAQ_ITEMS, "zzzz-tidak-ada")).toEqual([]);
  });
});

describe("FAQ component", () => {
  it("filters as the user types and shows an empty state", () => {
    render(<Faq />);
    const input = screen.getByLabelText(/cari pertanyaan/i);
    fireEvent.change(input, { target: { value: "tato" } });
    expect(screen.getByText(/boleh donor kalau punya tato/i)).toBeTruthy();
    expect(screen.queryByText(/berapa umur minimal/i)).toBeNull();
    fireEvent.change(input, { target: { value: "zzzz-tidak-ada" } });
    expect(screen.getByText(/tidak ada hasil/i)).toBeTruthy();
  });

  it("lists every answer's source and points to the official portal", () => {
    const { container } = render(<Faq />);
    expect(container.textContent).toMatch(/Sumber: Permenkes 91\/2015/);
    expect(container.querySelectorAll('a[href^="https://jdih.kemkes.go.id"]').length).toBeGreaterThan(5);
    expect(container.textContent).toMatch(/ayodonor\.pmi\.or\.id/);
    expect(container.querySelectorAll("details").length).toBe(FAQ_ITEMS.length);
  });
});
