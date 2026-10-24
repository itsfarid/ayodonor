// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Faq from "../src/components/Faq";
import { FAQ_ITEMS, searchFaq } from "../src/data/faq";

afterEach(cleanup);

describe("FAQ data", () => {
  it("has a source for every answer and no clearance or benefit claims", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(10);
    for (const item of FAQ_ITEMS) {
      expect(item.source.length, item.id).toBeGreaterThan(3);
      const text = `${item.question} ${item.answer}`;
      expect(text, item.id).not.toMatch(/\blolos\b|100\s?%|sertifikat|pasti boleh|kolesterol|kulit cerah|stamina|kalori/i);
    }
    expect(new Set(FAQ_ITEMS.map((i) => i.id)).size).toBe(FAQ_ITEMS.length);
  });

  it("states disagreement between sources instead of picking a number", () => {
    const get = (id: string) => FAQ_ITEMS.find((i) => i.id === id)!.answer;
    expect(get("jeda")).toMatch(/2 bulan/);
    expect(get("jeda")).toMatch(/3 bulan/);
    expect(get("tato")).toMatch(/1 tahun/);
    expect(get("haid")).toMatch(/tidak menemukan ketentuan resmi/);
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
    expect(container.textContent).toMatch(/ayodonor\.pmi\.or\.id/);
    expect(container.querySelectorAll("details").length).toBe(FAQ_ITEMS.length);
  });
});
