import type { AddressInfo } from "net";
import type { AppOptions } from "../../server/app";
import { createApp } from "../../server/app";
import { createStaticFixture, type StaticFixture } from "./fixtures";

export interface TestServer {
  baseUrl: string;
  fixture: StaticFixture;
  close: () => Promise<void>;
}

export async function startTestServer(overrides: Partial<AppOptions> = {}): Promise<TestServer> {
  const fixture = createStaticFixture();
  let app;
  try {
    app = await createApp({
      mode: "production",
      staticDir: fixture.publicDir,
      logRequests: false,
      ...overrides,
    });
  } catch (err) {
    fixture.cleanup();
    throw err;
  }
  const server = await new Promise<import("http").Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    fixture,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          fixture.cleanup();
          err ? reject(err) : resolve();
        });
        server.closeAllConnections();
      }),
  };
}

export function postJson(baseUrl: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(baseUrl + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
