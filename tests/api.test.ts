import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeGemini, postJson, SAFE_QUIZ, startTestServer, type TestServer } from "./helpers/server";

let server: TestServer | undefined;

beforeEach(() => {
  // Error paths log on purpose; keep test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

describe("GET /api/health", () => {
  it("returns the documented payload", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      message: "AyoDonor server running gracefully!",
    });
  });
});

describe("POST /api/gemini/evaluate", () => {
  it("uses the mocked Gemini client on the success path", async () => {
    const gemini = fakeGemini(async () => ({ text: "hasil dari AI palsu" }));
    server = await startTestServer({ getGeminiClient: () => gemini });
    const res = await postJson(server.baseUrl, "/api/gemini/evaluate", SAFE_QUIZ);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.text).toBe("hasil dari AI palsu");
    expect(gemini.calls).toHaveLength(1);
  });

  it("answers from the local fallback when no client is configured", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/evaluate", SAFE_QUIZ);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.text).toBe("string");
  });

  it("rejects values outside the answer enum", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/evaluate", { ...SAFE_QUIZ, sleep: "maybe" });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe("POST /api/gemini/chat", () => {
  it("rejects an empty message", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/chat", { message: "   ", history: [] });
    expect(res.status).toBe(400);
  });

  it("rejects a message longer than 500 characters", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/chat", { message: "a".repeat(501), history: [] });
    expect(res.status).toBe(400);
  });
});

describe("rate limiting", () => {
  it("answers 429 with standard headers once the limit is exceeded", async () => {
    server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 3 } });
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 4; i++) {
      last = await postJson(server.baseUrl, "/api/gemini/chat", { message: "donor", history: [] });
      statuses.push(last.status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(last!.headers.get("ratelimit-limit")).toBe("3");
    expect(last!.headers.get("retry-after")).not.toBeNull();
  });
});
