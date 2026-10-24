import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BODY_LIMIT } from "../server/app";
import { postJson, startTestServer, type TestServer } from "./helpers/server";

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

describe("GET /api/health", () => {
  it("returns the documented payload without any API key or provider configured", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", message: "AyoDonor server running gracefully!" });
  });

  it("sets an X-Request-Id on every response", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/health");
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("removed AI endpoints", () => {
  const OBSOLETE = [
    ["POST", "/api/gemini/chat"],
    ["POST", "/api/gemini/evaluate"],
    ["GET", "/api/gemini/chat"],
    ["POST", "/api/chat"],
    ["POST", "/api/evaluate"],
  ] as const;

  it.each(OBSOLETE)("%s %s is gone (404, JSON, no SPA fallback)", async (method, path) => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify({ message: "halo", history: [] }) : undefined,
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toMatchObject({ success: false, code: "not_found" });
  });
});

describe("general API controls still apply under /api", () => {
  it("rejects malformed JSON with 400 and does not echo the body", async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/anything", '{"secret": "ECHO-CHECK",');
    const text = await res.text();
    expect(res.status).toBe(400);
    expect(JSON.parse(text)).toEqual({ success: false, error: "Format JSON tidak valid.", code: "invalid_json" });
    expect(text).not.toContain("ECHO-CHECK");
  });

  it(`rejects bodies over ${API_BODY_LIMIT} with 413`, async () => {
    server = await startTestServer();
    const res = await postJson(server.baseUrl, "/api/anything", { pad: "a".repeat(4096) });
    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("payload_too_large");
  });

  it("answers 429 with standard headers once the limit is exceeded, counting invalid requests too", async () => {
    server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 3 } });
    const statuses: number[] = [];
    let last: Response | undefined;
    const requests = [
      () => fetch(server!.baseUrl + "/api/health"),
      () => postJson(server!.baseUrl, "/api/anything", "{bad"),
      () => fetch(server!.baseUrl + "/api/health"),
      () => fetch(server!.baseUrl + "/api/health"),
    ];
    for (const send of requests) {
      last = await send();
      statuses.push(last.status);
    }
    expect(statuses).toEqual([200, 400, 200, 429]);
    expect(last!.headers.get("ratelimit-limit")).toBe("3");
    expect(last!.headers.get("retry-after")).not.toBeNull();
    expect((await last!.json()).code).toBe("rate_limited");
  });

  it("recovers after the window using a controlled clock", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 1 } });
      const send = () => fetch(server!.baseUrl + "/api/health");
      expect((await send()).status).toBe(200);
      expect((await send()).status).toBe(429);
      vi.setSystemTime(Date.now() + 61_000);
      expect((await send()).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it("logs request metadata only, never bodies or query strings", async () => {
    server = await startTestServer({ logRequests: true });
    await postJson(server.baseUrl, "/api/anything", { note: "RAHASIA-BODY" });
    await fetch(server.baseUrl + "/api/health?token=RAHASIA-QUERY");
    const logs = logged.join("\n");
    expect(logs).toContain('"event":"request"');
    expect(logs).toContain('"path":"/api/health"');
    expect(logs).not.toContain("RAHASIA-BODY");
    expect(logs).not.toContain("RAHASIA-QUERY");
  });
});
