// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { MEDICAL_DISCLAIMER } from "../shared/content";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // The app must not call any server for the quiz or FAQ.
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

function runQuiz(answers: Array<"safe" | "unsafe"> = ["safe", "safe", "safe", "safe"]) {
  fireEvent.change(screen.getByLabelText(/nama panggilan/i), { target: { value: "Rizki" } });
  fireEvent.click(screen.getByRole("button", { name: /mulai kuis/i }));
  ["q1", "q2", "q3", "q4"].forEach((id, i) => fireEvent.click(document.getElementById(`btn-${id}-${answers[i]}`)!));
}

const resultText = () => document.getElementById("quiz-results")?.textContent ?? "";
const NO_CLEARANCE = [/\blolos\b/i, /100\s?%/, /(?<!bukan )sertifikat/i, /fit luar dalam/i, /memenuhi syarat/i, /tidak layak/i];

describe("quiz (client-side only)", () => {
  it("shows a neutral summary immediately, with the disclaimer, and never calls the network", () => {
    render(<App />);
    runQuiz();
    expect(resultText()).toContain("bukan keputusan kelayakan");
    expect(resultText()).toContain(MEDICAL_DISCLAIMER);
    expect(resultText()).toMatch(/tidak dikirim ke mana pun/);
    for (const claim of NO_CLEARANCE) expect(resultText()).not.toMatch(claim);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the ask-PMI framing for non-safe answers, never a rejection", () => {
    render(<App />);
    runQuiz(["unsafe", "safe", "unsafe", "unsafe"]);
    expect(resultText()).toMatch(/tanyakan|bertanya/i);
    expect(resultText()).toMatch(/bukan berarti kamu tidak bisa donor/i);
    expect(resultText()).not.toContain("*"); // markdown renders instead of leaking asterisks
    for (const claim of NO_CLEARANCE) expect(resultText()).not.toMatch(claim);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("offers the non-certifying intent card after the quiz", () => {
    render(<App />);
    runQuiz();
    expect(resultText()).toContain("Kartu Niat Donor");
    expect(resultText()).toMatch(/bukan sertifikat/i);
  });

  it("can be retaken", () => {
    render(<App />);
    runQuiz();
    fireEvent.click(screen.getByRole("button", { name: /ulangi kuis/i }));
    expect(document.getElementById("quiz-results")).toBeNull();
    expect(document.getElementById("question-1")).not.toBeNull();
  });

  it("questions do not assert unverified criteria", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/nama panggilan/i), { target: { value: "Tes" } });
    fireEvent.click(screen.getByRole("button", { name: /mulai kuis/i }));
    const seen: string[] = [];
    for (const id of ["q1", "q2", "q3", "q4"]) {
      seen.push(document.getElementById(`question-${id.slice(1)}`)!.textContent ?? "");
      fireEvent.click(document.getElementById(`btn-${id}-safe`)!);
    }
    const all = seen.join(" ");
    expect(all).not.toMatch(/haid|menstruasi/i);
    expect(all).not.toMatch(/\b5 jam\b|17 sampai 60|56 hari/i);
    expect(all).toMatch(/petugas PMI/i);
  });
});

describe("AI chat is gone", () => {
  it("exposes no chat interface, AI status, model name or provider wording", () => {
    const { container } = render(<App />);
    const text = container.textContent ?? "";
    expect(container.querySelector("#chat-section")).toBeNull();
    expect(container.querySelector("#chat-message-input")).toBeNull();
    expect(screen.queryByRole("button", { name: /kirim pesan/i })).toBeNull();
    for (const banned of [/sobat hero ai/i, /asisten ai/i, /gemini/i, /terhubung ke ai/i, /mode offline/i, /balasan otomatis/i, /dijawab ai/i]) {
      expect(text).not.toMatch(banned);
    }
  });

  it("renders the FAQ in its place", () => {
    const { container } = render(<App />);
    expect(container.querySelector("#faq-section")).not.toBeNull();
    expect(screen.getByLabelText(/cari pertanyaan/i)).toBeTruthy();
  });

  it("makes no network request on load", () => {
    render(<App />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
