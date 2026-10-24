import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../server/app";
import { loadConfig } from "../server/config";
import { createStaticFixture, ENV_MARKER, SERVER_MARKER } from "./helpers/fixtures";
import { startTestServer, type TestServer } from "./helpers/server";

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

describe("public asset exposure (production)", () => {
  const SENSITIVE_PATHS = [
    "/server/index.cjs",
    "/server/index.cjs.map",
    "/index.cjs.map",
    "/server.cjs",
    "/server.cjs.map",
    "/.env",
    "/.env.local",
    "/assets/.env",
    "/%2e%2e/.env.local",
    "/%2e%2e/server/index.cjs",
    "/..%2f.env.local",
    "/assets/app.js.map",
  ];

  it.each(SENSITIVE_PATHS)("does not serve %s", async (p) => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + p);
    const body = await res.text();
    expect(res.status).toBe(404);
    expect(body).not.toContain(SERVER_MARKER);
    expect(body).not.toContain(ENV_MARKER);
  });

  it("blocks a source map even if one is placed inside the public directory", async () => {
    server = await startTestServer();
    fs.writeFileSync(path.join(server.fixture.publicDir, "assets", "leak.js.map"), `{"sourcesContent":["${SERVER_MARKER}"]}`);
    const res = await fetch(server.baseUrl + "/assets/leak.js.map");
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain(SERVER_MARKER);
  });

  it("does not advertise Express", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/health");
    expect(res.headers.get("x-powered-by")).toBeNull();
  });
});

describe("SPA and static serving (production)", () => {
  it("serves index.html at / and for extension-less SPA routes", async () => {
    server = await startTestServer();
    for (const p of ["/", "/kuis", "/some/deep/route"]) {
      const res = await fetch(server.baseUrl + p);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/text\/html/);
      expect(await res.text()).toContain("<title>fixture</title>");
    }
  });

  it("serves built assets", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/assets/app.js");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/javascript/);
  });

  it("returns a real 404 for missing files instead of the SPA shell", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/favicon.svg");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).not.toMatch(/text\/html/);
  });

  it("returns a JSON 404 for unknown API routes", async () => {
    server = await startTestServer();
    const res = await fetch(server.baseUrl + "/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect((await res.json()).success).toBe(false);
  });
});

describe("startup mode selection", () => {
  it("fails with an actionable message when the production build is missing", async () => {
    const fixture = createStaticFixture();
    try {
      await expect(
        createApp({ mode: "production", getGeminiClient: () => null, staticDir: path.join(fixture.root, "nope") })
      ).rejects.toThrow(/npm run build/);
    } finally {
      fixture.cleanup();
    }
  });

  it("never creates the Vite dev middleware in production mode", async () => {
    const createDevMiddleware = vi.fn(async () => ((_req: any, _res: any, next: any) => next()) as any);
    server = await startTestServer({ createDevMiddleware });
    expect(createDevMiddleware).not.toHaveBeenCalled();
  });

  it("creates the dev middleware in development mode", async () => {
    const createDevMiddleware = vi.fn(async () => ((_req: any, _res: any, next: any) => next()) as any);
    server = await startTestServer({ mode: "development", createDevMiddleware });
    expect(createDevMiddleware).toHaveBeenCalledTimes(1);
  });

  it("requires a dev middleware factory in development mode", async () => {
    await expect(createApp({ mode: "development", getGeminiClient: () => null })).rejects.toThrow(/createDevMiddleware/);
  });
});

describe("loadConfig", () => {
  it("defaults to development on loopback port 3000", () => {
    const c = loadConfig({}, "/app");
    expect(c).toMatchObject({ mode: "development", port: 3000, host: "127.0.0.1" });
  });

  it("treats only NODE_ENV=production as production and binds all interfaces", () => {
    expect(loadConfig({ NODE_ENV: "production" }, "/app")).toMatchObject({ mode: "production", host: "0.0.0.0" });
    expect(loadConfig({ NODE_ENV: "staging" }, "/app").mode).toBe("development");
  });

  it("honors PORT and rejects invalid values", () => {
    expect(loadConfig({ PORT: "8080" }, "/app").port).toBe(8080);
    for (const bad of ["abc", "0", "70000", "80.5", "-1"]) {
      expect(() => loadConfig({ PORT: bad }, "/app")).toThrow(/Invalid PORT/);
    }
  });

  it("serves from dist/public by default", () => {
    expect(loadConfig({}, "/app").staticDir).toBe(path.resolve("/app", "dist", "public"));
  });
});
