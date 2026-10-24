// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { MEDICAL_DISCLAIMER, OFFLINE_NOTICE } from "../shared/content";

type Reply = { status?: number; body: unknown } | "network-error";

function mockApi(handler: (url: string, body: any) => Reply) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const reply = handler(String(url), body);
    if (reply === "network-error") throw new TypeError("fetch failed");
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function runQuiz(answers: Array<"safe" | "unsafe"> = ["safe", "safe", "safe", "safe"]) {
  fireEvent.change(screen.getByLabelText(/nama panggilan pahlawan/i), { target: { value: "Rizki" } });
  fireEvent.click(screen.getByRole("button", { name: /mulai simulator kelayakan/i }));
  const ids = ["q1", "q2", "q3", "q4"];
  for (let i = 0; i < 4; i++) {
    const button = document.getElementById(`btn-${ids[i]}-${answers[i]}`)!;
    await act(async () => fireEvent.click(button));
  }
}

const resultText = () => document.getElementById("quiz-results")?.textContent ?? "";
const NO_CLEARANCE = [/\blolos\b/i, /100\s?%/, /(?<!bukan )sertifikat/i, /fit luar dalam/i, /memenuhi syarat/i, /tidak layak/i];

describe("quiz result states", () => {
  it("uses the built-in summary and says so when the API is unreachable", async () => {
    mockApi(() => "network-error");
    render(<App />);
    await runQuiz();
    await waitFor(() => expect(resultText()).toContain(OFFLINE_NOTICE));
    expect(resultText()).toContain(MEDICAL_DISCLAIMER);
    for (const claim of NO_CLEARANCE) expect(resultText()).not.toMatch(claim);
  });

  it("labels a server fallback as automatic, not as AI", async () => {
    mockApi(() => ({ body: { success: true, source: "fallback", fallbackReason: "quota", text: "### Ringkasan otomatis" } }));
    render(<App />);
    await runQuiz();
    await waitFor(() => expect(resultText()).toContain("Ringkasan otomatis"));
    expect(resultText()).toContain(OFFLINE_NOTICE);
    expect(resultText()).not.toMatch(/ditulis AI/);
  });

  it("labels live AI text and warns that it can be wrong", async () => {
    mockApi(() => ({ body: { success: true, source: "ai", text: "### Penjelasan dari model" } }));
    render(<App />);
    await runQuiz();
    await waitFor(() => expect(resultText()).toContain("Penjelasan dari model"));
    expect(resultText()).toMatch(/ditulis AI dan bisa keliru/);
    expect(resultText()).not.toContain(OFFLINE_NOTICE);
  });

  it("shows the unsure/ask-PMI framing for non-safe answers, never a rejection", async () => {
    mockApi(() => "network-error");
    render(<App />);
    await runQuiz(["unsafe", "safe", "unsafe", "unsafe"]);
    await waitFor(() => expect(resultText()).toMatch(/tanyakan|bertanya/i));
    expect(resultText()).toMatch(/bukan berarti kamu tidak bisa donor/i);
    expect(resultText()).not.toContain("*"); // markdown bold/bullets must render, not leak as asterisks
    for (const claim of NO_CLEARANCE) expect(resultText()).not.toMatch(claim);
  });

  it("sends exactly the quiz fields and calls the API once", async () => {
    const fetchMock = mockApi(() => ({ body: { success: true, source: "ai", text: "ok" } }));
    render(<App />);
    await runQuiz(["safe", "unsafe", "safe", "unsafe"]);
    await waitFor(() => expect(resultText()).toContain("ok"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/gemini/evaluate");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({
      name: "Rizki",
      ageWeight: "safe",
      sleep: "unsafe",
      meds: "safe",
      recency: "unsafe",
    });
  });

  it("shows the non-certifying intent card instead of a certificate", async () => {
    mockApi(() => "network-error");
    render(<App />);
    await runQuiz();
    await waitFor(() => expect(resultText()).toContain("Kartu Niat Donor"));
    expect(resultText()).toMatch(/bukan sertifikat/i);
  });
});

describe("quiz questions", () => {
  it("do not assert unverified criteria", async () => {
    mockApi(() => "network-error");
    render(<App />);
    const seen: string[] = [];
    fireEvent.change(screen.getByLabelText(/nama panggilan pahlawan/i), { target: { value: "Tes" } });
    fireEvent.click(screen.getByRole("button", { name: /mulai simulator kelayakan/i }));
    for (const id of ["q1", "q2", "q3", "q4"]) {
      seen.push(document.getElementById(`question-${id.slice(1)}`)!.textContent ?? "");
      await act(async () => fireEvent.click(document.getElementById(`btn-${id}-safe`)!));
    }
    const all = seen.join(" ");
    expect(all).not.toMatch(/haid|menstruasi/i);
    expect(all).not.toMatch(/\b5 jam\b|17 sampai 60|56 hari/i);
    expect(all).toMatch(/petugas PMI/i);
  });
});

describe("chat status and errors", () => {
  const send = async (text: string) => {
    fireEvent.change(screen.getByLabelText(/tulis pertanyaan/i), { target: { value: text } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /kirim pesan/i })));
  };

  it("does not claim to be online or name a model before any answer", () => {
    mockApi(() => ({ body: {} }));
    render(<App />);
    expect(document.body.textContent).not.toMatch(/Online|selalu humoris|gemini-3/i);
    expect(screen.getByRole("status").textContent).toContain("AI bila tersedia");
  });

  it("flags automatic replies and switches to offline status when the API fails", async () => {
    mockApi(() => "network-error");
    render(<App />);
    await send("takut jarum suntik");
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Mode offline"));
    expect(document.body.textContent).toContain("Balasan otomatis, bukan dari AI");
  });

  it("shows the live status only after a real AI answer", async () => {
    mockApi(() => ({ body: { success: true, source: "ai", text: "Jawaban dari model" } }));
    render(<App />);
    await send("apa itu donor darah?");
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Terhubung ke AI"));
    expect(document.body.textContent).toContain("Dijawab AI");
  });

  it("treats a server fallback as offline, not as AI", async () => {
    mockApi(() => ({ body: { success: true, source: "fallback", fallbackReason: "quota", text: "balasan kalengan" } }));
    render(<App />);
    await send("donor");
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Mode offline"));
    expect(document.body.textContent).not.toContain("Dijawab AI");
  });

  it("surfaces rate-limit errors instead of faking an answer", async () => {
    mockApi(() => ({ status: 429, body: { success: false, code: "rate_limited", error: "Terlalu banyak permintaan, coba lagi sebentar ya." } }));
    render(<App />);
    await send("donor");
    await waitFor(() => expect(document.body.textContent).toContain("Terlalu banyak permintaan"));
    expect(document.body.textContent).toContain("Pesan sistem");
    expect(document.body.textContent).not.toContain("Balasan otomatis, bukan dari AI");
  });

  it("never sends automatic or system messages back as history, and caps history at 10", async () => {
    let n = 0;
    const fetchMock = mockApi(() => (++n === 1 ? "network-error" : { body: { success: true, source: "ai", text: `jawaban ${n}` } }));
    render(<App />);
    await send("donor satu"); // becomes an automatic reply
    for (let i = 0; i < 8; i++) await send(`pertanyaan ${i}`);
    const lastBody = JSON.parse(String(fetchMock.mock.calls.at(-1)![1]!.body));
    expect(lastBody.history.length).toBeLessThanOrEqual(10);
    expect(JSON.stringify(lastBody.history)).not.toMatch(/Jawaban otomatis|Waduh|bukan dari AI/);
    for (const h of lastBody.history) expect(Object.keys(h).sort()).toEqual(["role", "text"]);
  });
});
