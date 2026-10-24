import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITS, validateChat, validateEvaluate } from "../server/validation";
import { fakeGemini, postJson, SAFE_QUIZ, startTestServer, type TestServer } from "./helpers/server";

let server: TestServer | undefined;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

describe("validateEvaluate (unit)", () => {
  it("accepts a complete valid payload and trims an empty name to undefined", () => {
    const r = validateEvaluate({ ...SAFE_QUIZ, name: "   " });
    expect(r).toEqual({ ok: true, value: { name: undefined, ageWeight: "safe", sleep: "safe", meds: "safe", recency: "safe" } });
  });

  it.each([null, undefined, [], "x", 5])("rejects non-object body %j", (body) => {
    expect(validateEvaluate(body)).toMatchObject({ ok: false });
  });

  it("rejects missing, non-string and out-of-enum answers", () => {
    expect(validateEvaluate({ ...SAFE_QUIZ, sleep: undefined })).toMatchObject({ ok: false });
    expect(validateEvaluate({ ...SAFE_QUIZ, meds: 1 })).toMatchObject({ ok: false });
    expect(validateEvaluate({ ...SAFE_QUIZ, recency: "SAFE" })).toMatchObject({ ok: false });
  });

  it("rejects instead of truncating an over-long or non-string name", () => {
    expect(validateEvaluate({ ...SAFE_QUIZ, name: "a".repeat(LIMITS.nameChars + 1) })).toMatchObject({ ok: false });
    expect(validateEvaluate({ ...SAFE_QUIZ, name: { x: 1 } })).toMatchObject({ ok: false });
    expect(validateEvaluate({ ...SAFE_QUIZ, name: "a".repeat(LIMITS.nameChars) })).toMatchObject({ ok: true });
  });
});

describe("validateChat (unit)", () => {
  it("defaults a missing history to []", () => {
    expect(validateChat({ message: "halo" })).toEqual({ ok: true, value: { message: "halo", history: [] } });
  });

  it("enforces message, history length, item length and role", () => {
    expect(validateChat({ message: "a".repeat(LIMITS.messageChars + 1) })).toMatchObject({ ok: false });
    const tooMany = Array.from({ length: LIMITS.historyItems + 1 }, () => ({ role: "user", text: "x" }));
    expect(validateChat({ message: "halo", history: tooMany })).toMatchObject({ ok: false });
    expect(validateChat({ message: "halo", history: [{ role: "user", text: "a".repeat(LIMITS.historyItemChars + 1) }] })).toMatchObject({ ok: false });
    expect(validateChat({ message: "halo", history: [{ role: "system", text: "x" }] })).toMatchObject({ ok: false });
    expect(validateChat({ message: "halo", history: [{ role: "user" }] })).toMatchObject({ ok: false });
    expect(validateChat({ message: "halo", history: "nope" })).toMatchObject({ ok: false });
  });

  it("accepts history at exactly the limits", () => {
    const history = Array.from({ length: LIMITS.historyItems }, () => ({ role: "model", text: "a".repeat(LIMITS.historyItemChars) }));
    expect(validateChat({ message: "a".repeat(LIMITS.messageChars), history })).toMatchObject({ ok: true });
  });
});

describe("request parsing over HTTP", () => {
  it("answers 400 invalid_json for malformed JSON without echoing the body", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/chat", '{"message": "SECRET-ECHO-CHECK",');
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ success: false, error: "Format JSON tidak valid.", code: "invalid_json" });
    expect(text).not.toContain("SECRET-ECHO-CHECK");
  });

  it("answers 413 for an oversized evaluate body", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/evaluate", { ...SAFE_QUIZ, name: "a".repeat(8000) });
    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("payload_too_large");
  });

  it("answers 413 for an oversized chat body", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/chat", { message: "halo", pad: "a".repeat(120 * 1024) });
    expect(res.status).toBe(413);
  });

  it("rejects excessive history, over-long items, and over-long messages with 400", async () => {
    server = await startTestServer();
    const tooMany = Array.from({ length: LIMITS.historyItems + 1 }, () => ({ role: "user", text: "x" }));
    for (const body of [
      { message: "halo", history: tooMany },
      { message: "halo", history: [{ role: "user", text: "a".repeat(LIMITS.historyItemChars + 1) }] },
      { message: "a".repeat(LIMITS.messageChars + 1), history: [] },
    ]) {
      const res = await postJson(server.baseUrl, "/api/gemini/chat", body);
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe("invalid_request");
    }
  });

  it("rejects a request without a JSON content type with 400", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/gemini/chat", { method: "POST", body: "message=halo" });
    expect(res.status).toBe(400);
  });

  it("forwards valid history to the (mocked) provider unchanged", async () => {
    const gemini = fakeGemini(async () => ({ text: "ok" }));
    server = await startTestServer({ getGeminiClient: () => gemini });
    const history = [
      { role: "model", text: "Halo!" },
      { role: "user", text: "Apa itu donor?" },
    ];
    const res = await postJson(server.baseUrl, "/api/gemini/chat", { message: "Lanjut", history });
    expect(res.status).toBe(200);
    expect(gemini.calls[0].contents).toEqual([
      { role: "model", parts: [{ text: "Halo!" }] },
      { role: "user", parts: [{ text: "Apa itu donor?" }] },
      { role: "user", parts: [{ text: "Lanjut" }] },
    ]);
  });
});

describe("rate limiting covers invalid requests", () => {
  it("counts malformed requests and returns a coded 429", async () => {
    server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 2 } });
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 3; i++) {
      last = await postJson(server.baseUrl, "/api/gemini/chat", "{bad");
      statuses.push(last.status);
    }
    expect(statuses).toEqual([400, 400, 429]);
    expect((await last!.json()).code).toBe("rate_limited");
  });

  it("resets after the window using a controlled clock", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 1 } });
      const send = () => postJson(server!.baseUrl, "/api/gemini/chat", { message: "donor", history: [] });
      expect((await send()).status).toBe(200);
      expect((await send()).status).toBe(429);
      vi.setSystemTime(Date.now() + 61_000);
      expect((await send()).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });
});
