import path from "path";

export interface ServerConfig {
  mode: "development" | "production";
  port: number;
  host: string;
  /** Directory holding the built frontend (index.html + assets) in production. */
  staticDir: string;
  /** Number of reverse-proxy hops to trust for client IP detection (0 = none). */
  trustProxyHops: number;
  /** Hard deadline for one Gemini request. */
  geminiTimeoutMs: number;
}

function parseTrustProxy(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  if (!/^\d+$/.test(raw) || Number(raw) > 10) {
    throw new Error(
      `Invalid TRUST_PROXY "${raw}": expected the number of trusted proxy hops (0-10). "true" is rejected because it lets clients spoof their IP.`
    );
  }
  return Number(raw);
}

function parseTimeout(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 20_000;
  if (!/^\d+$/.test(raw) || Number(raw) < 1000 || Number(raw) > 120_000) {
    throw new Error(`Invalid GEMINI_TIMEOUT_MS "${raw}": expected milliseconds between 1000 and 120000.`);
  }
  return Number(raw);
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 3000;
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) {
    throw new Error(`Invalid PORT "${raw}": expected an integer between 1 and 65535.`);
  }
  return Number(raw);
}

/**
 * Reads runtime configuration from the environment.
 * Never reads or returns secrets (GEMINI_API_KEY is handled separately).
 */
export function loadConfig(env: NodeJS.ProcessEnv, cwd: string = process.cwd()): ServerConfig {
  const mode = env.NODE_ENV === "production" ? "production" : "development";
  return {
    mode,
    port: parsePort(env.PORT),
    // Production containers must listen on all interfaces; the dev server only on loopback.
    host: env.HOST || (mode === "production" ? "0.0.0.0" : "127.0.0.1"),
    staticDir: env.STATIC_DIR ? path.resolve(cwd, env.STATIC_DIR) : path.resolve(cwd, "dist", "public"),
    trustProxyHops: parseTrustProxy(env.TRUST_PROXY),
    geminiTimeoutMs: parseTimeout(env.GEMINI_TIMEOUT_MS),
  };
}
