import type { AddressInfo } from "net";
import type { AppOptions, GeminiClientLike } from "../../server/app";
import { createApp } from "../../server/app";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

/** A fake Gemini client; never touches the network. */
export function fakeGemini(
  impl: (params: any) => Promise<{ text?: string }>
): GeminiClientLike & { calls: any[] } {
  const calls: any[] = [];
  return {
    calls,
    models: {
      generateContent: async (params: any) => {
        calls.push(params);
        return impl(params);
      },
    },
  };
}

export async function startTestServer(overrides: Partial<AppOptions> = {}): Promise<TestServer> {
  const app = await createApp({
    mode: "production",
    getGeminiClient: () => null,
    staticDir: "/nonexistent-static-dir",
    ...overrides,
  });
  const server = await new Promise<import("http").Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
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

export const SAFE_QUIZ = { name: "Tester", ageWeight: "safe", sleep: "safe", meds: "safe", recency: "safe" };
