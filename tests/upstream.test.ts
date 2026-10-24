import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyUpstreamError } from "../server/gemini";
import { fakeGemini, postJson, SAFE_QUIZ, startTestServer, type TestServer } from "./helpers/server";

let server: TestServer | undefined;
let logged: string[];

beforeEach(() => {
  logged = [];
  const capture = (...args: unknown[]) => void logged.push(args.map(String).join(" "));
  vi.spyOn(console, "error").mockImplementation(capture);
  vi.spyOn(console, "warn").mockImplementation(capture);
  vi.spyOn(console, "log").mockImplementation(capture);
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

const CHAT = { message: "RAHASIA-PESAN-PENGGUNA", history: [] };
const PROVIDER_SECRET = "sk-provider-internal-detail-12345 at /srv/internal/path";

async function chatWith(impl: (p: any) => Promise<{ text?: string }>, extra: Record<string, unknown> = {}) {
  const gemini = fakeGemini(impl);
  server = await startTestServer({ getGeminiClient: () => gemini, ...extra });
  const res = await postJson(server.baseUrl, "/api/gemini/chat", CHAT);
  return { res, gemini, body: await res.json() };
}

describe("upstream handling (mocked Gemini)", () => {
  it("labels a live answer as source=ai", async () => {
    const { res, body, gemini } = await chatWith(async () => ({ text: "jawaban AI" }));
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, source: "ai", text: "jawaban AI" });
    expect(gemini.calls[0].config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("labels a missing key as a fallback with reason=unconfigured", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/gemini/chat", CHAT);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, source: "fallback", fallbackReason: "unconfigured" });
  });

  it("answers quota exhaustion with a fallback that is explicitly labelled", async () => {
    const { res, body } = await chatWith(async () => {
      throw Object.assign(new Error("RESOURCE_EXHAUSTED " + PROVIDER_SECRET), { status: 429 });
    });
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, source: "fallback", fallbackReason: "quota" });
    expect(JSON.stringify(body)).not.toContain("provider-internal");
  });

  it("returns 504 upstream_timeout when Gemini exceeds the deadline", async () => {
    const { res, body } = await chatWith(() => new Promise(() => {}), { geminiTimeoutMs: 40 });
    expect(res.status).toBe(504);
    expect(body).toMatchObject({ success: false, code: "upstream_timeout" });
  });

  it("returns 502 upstream_unavailable on network failures", async () => {
    const { res, body } = await chatWith(async () => {
      throw Object.assign(new Error("connect ECONNRESET " + PROVIDER_SECRET), { code: "ECONNRESET" });
    });
    expect(res.status).toBe(502);
    expect(body.code).toBe("upstream_unavailable");
  });

  it.each([
    ["undefined text", { text: undefined }],
    ["empty text", { text: "   " }],
    ["oversized text", { text: "a".repeat(9000) }],
  ])("returns 502 upstream_invalid_response for %s", async (_name, reply) => {
    const { res, body } = await chatWith(async () => reply as { text?: string });
    expect(res.status).toBe(502);
    expect(body.code).toBe("upstream_invalid_response");
  });

  it("treats a throwing text getter as an invalid response", async () => {
    const { res, body } = await chatWith(async () => ({
      get text(): string {
        throw new Error(PROVIDER_SECRET);
      },
    }));
    expect(res.status).toBe(502);
    expect(body.code).toBe("upstream_invalid_response");
  });

  it("hides unexpected provider failures and never leaks them to the client or the logs", async () => {
    const { res, body } = await chatWith(async () => {
      throw Object.assign(new Error(PROVIDER_SECRET), { status: 500, stack: "STACK-" + PROVIDER_SECRET });
    });
    const raw = JSON.stringify(body);
    expect(res.status).toBe(502);
    expect(raw).not.toContain("provider-internal");
    expect(raw).not.toContain("STACK-");
    expect(raw).not.toContain("/srv/internal");
    const logs = logged.join("\n");
    expect(logs).toContain("gemini_failure");
    expect(logs).not.toContain("provider-internal");
    expect(logs).not.toContain("RAHASIA-PESAN-PENGGUNA");
  });

  it("applies the same handling to the evaluate endpoint", async () => {
    const gemini = fakeGemini(() => new Promise(() => {}));
    server = await startTestServer({ getGeminiClient: () => gemini, geminiTimeoutMs: 40 });
    const res = await postJson(server.baseUrl, "/api/gemini/evaluate", SAFE_QUIZ);
    expect(res.status).toBe(504);
    expect((await res.json()).code).toBe("upstream_timeout");
  });

  it("does not log donor answers, names or chat text on any path", async () => {
    const gemini = fakeGemini(async () => {
      throw Object.assign(new Error("boom"), { status: 429 });
    });
    server = await startTestServer({ getGeminiClient: () => gemini, logRequests: true });
    await postJson(server.baseUrl, "/api/gemini/evaluate", { ...SAFE_QUIZ, name: "NAMA-RAHASIA" });
    await postJson(server.baseUrl, "/api/gemini/chat", CHAT);
    await postJson(server.baseUrl, "/api/gemini/chat", '{"message":"RAHASIA-PESAN-PENGGUNA"');
    const logs = logged.join("\n");
    expect(logs).toContain('"event":"request"');
    expect(logs).not.toContain("NAMA-RAHASIA");
    expect(logs).not.toContain("RAHASIA-PESAN-PENGGUNA");
  });

  it("sets an X-Request-Id header on every response", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/health");
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("classifyUpstreamError", () => {
  it("maps representative errors to stable kinds", () => {
    expect(classifyUpstreamError({ status: 429 }).kind).toBe("quota");
    expect(classifyUpstreamError(new Error("Quota exceeded for metric")).kind).toBe("quota");
    expect(classifyUpstreamError(Object.assign(new Error("x"), { name: "AbortError" })).kind).toBe("timeout");
    expect(classifyUpstreamError(Object.assign(new Error("x"), { code: "ENOTFOUND" })).kind).toBe("network");
    expect(classifyUpstreamError(new TypeError("fetch failed")).kind).toBe("network");
    expect(classifyUpstreamError(new Error("whatever")).kind).toBe("upstream_error");
  });
});
