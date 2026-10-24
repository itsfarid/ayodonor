import path from "path";

export interface ServerConfig {
  mode: "development" | "production";
  port: number;
  host: string;
  /** Directory holding the built frontend (index.html + assets) in production. */
  staticDir: string;
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
  };
}
