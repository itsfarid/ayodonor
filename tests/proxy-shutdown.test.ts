import http from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../server/config";
import { createShutdown } from "../server/shutdown";
import { postJson, startTestServer, type TestServer } from "./helpers/server";

let server: TestServer | undefined;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

const chat = (url: string, ip: string) =>
  postJson(url, "/api/gemini/chat", { message: "donor", history: [] }, { "X-Forwarded-For": ip });

describe("proxy trust and client IP for rate limiting", () => {
  it("ignores X-Forwarded-For by default, so spoofed headers cannot dodge the limit", async () => {
    server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 1 } });
    expect((await chat(server.baseUrl, "1.1.1.1")).status).toBe(200);
    expect((await chat(server.baseUrl, "2.2.2.2")).status).toBe(429);
  });

  it("uses the forwarded client IP when one proxy hop is trusted", async () => {
    server = await startTestServer({ rateLimit: { windowMs: 60_000, limit: 1 }, trustProxyHops: 1 });
    expect((await chat(server.baseUrl, "1.1.1.1")).status).toBe(200);
    expect((await chat(server.baseUrl, "2.2.2.2")).status).toBe(200); // different client
    expect((await chat(server.baseUrl, "1.1.1.1")).status).toBe(429); // same client again
  });
});

describe("loadConfig: proxy and timeout", () => {
  it("defaults to no trusted proxy and a 20s upstream timeout", () => {
    expect(loadConfig({}, "/app")).toMatchObject({ trustProxyHops: 0, geminiTimeoutMs: 20_000 });
  });

  it("accepts a hop count and rejects values that could enable IP spoofing", () => {
    expect(loadConfig({ TRUST_PROXY: "1" }, "/app").trustProxyHops).toBe(1);
    for (const bad of ["true", "false", "-1", "1.5", "11", "loopback"]) {
      expect(() => loadConfig({ TRUST_PROXY: bad }, "/app")).toThrow(/Invalid TRUST_PROXY/);
    }
  });

  it("validates GEMINI_TIMEOUT_MS", () => {
    expect(loadConfig({ GEMINI_TIMEOUT_MS: "5000" }, "/app").geminiTimeoutMs).toBe(5000);
    for (const bad of ["abc", "10", "999999"]) {
      expect(() => loadConfig({ GEMINI_TIMEOUT_MS: bad }, "/app")).toThrow(/Invalid GEMINI_TIMEOUT_MS/);
    }
  });
});

describe("graceful shutdown", () => {
  function slowServer(delayMs: number) {
    const srv = http.createServer((_req, res) => {
      setTimeout(() => res.end("done"), delayMs);
    });
    return new Promise<{ srv: http.Server; url: string }>((resolve) =>
      srv.listen(0, "127.0.0.1", () => resolve({ srv, url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}` }))
    );
  }

  it("lets an in-flight request finish, refuses new ones, exits 0, and is idempotent", async () => {
    const { srv, url } = await slowServer(200);
    const exits: number[] = [];
    const shutdown = createShutdown(srv, { timeoutMs: 2000, onExit: (c) => exits.push(c) });

    const inFlight = fetch(url);
    await new Promise((r) => setTimeout(r, 50));
    shutdown("SIGTERM");
    shutdown("SIGTERM"); // duplicate signal must not re-run shutdown

    await expect(fetch(url)).rejects.toThrow(); // no new connections accepted
    const res = await inFlight;
    expect(await res.text()).toBe("done");
    await vi.waitFor(() => expect(exits).toEqual([0]));
  });

  it("forces exit code 1 when in-flight requests exceed the deadline", async () => {
    const { srv, url } = await slowServer(10_000);
    const exits: number[] = [];
    const shutdown = createShutdown(srv, { timeoutMs: 100, onExit: (c) => exits.push(c) });

    const stuck = fetch(url).catch(() => "aborted");
    await new Promise((r) => setTimeout(r, 50));
    shutdown("SIGINT");

    await vi.waitFor(() => expect(exits[0]).toBe(1), { timeout: 2000 });
    expect(await stuck).toBe("aborted");
  });
});
