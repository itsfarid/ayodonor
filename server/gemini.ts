import type { GeminiClientLike } from "./app";

export type UpstreamFailureKind = "timeout" | "quota" | "network" | "invalid_response" | "upstream_error";

export class UpstreamError extends Error {
  constructor(
    public readonly kind: UpstreamFailureKind,
    /** Numeric provider status when available; never the provider's message. */
    public readonly upstreamStatus?: number
  ) {
    super(kind);
    this.name = "UpstreamError";
  }
}

export const MAX_AI_TEXT_CHARS = 8000;

export function isGeminiQuotaError(err: any): boolean {
  const message = String(err?.message || "");
  return err?.status === 429 || message.includes("RESOURCE_EXHAUSTED") || /quota/i.test(message);
}

const NETWORK_CODES = new Set(["ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT"]);

export function classifyUpstreamError(err: any): UpstreamError {
  if (err instanceof UpstreamError) return err;
  const status = typeof err?.status === "number" ? err.status : undefined;
  if (isGeminiQuotaError(err)) return new UpstreamError("quota", status);
  if (err?.name === "AbortError" || err?.name === "TimeoutError") return new UpstreamError("timeout", status);
  const code = err?.code ?? err?.cause?.code;
  if (NETWORK_CODES.has(code) || (err instanceof TypeError && /fetch failed/i.test(String(err.message)))) {
    return new UpstreamError("network", status);
  }
  return new UpstreamError("upstream_error", status);
}

/**
 * Calls Gemini with a hard deadline and returns validated text.
 * Throws UpstreamError (never a raw provider error) so callers can map it to a safe response.
 */
export async function generateText(client: GeminiClientLike, params: any, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new UpstreamError("timeout"));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      client.models.generateContent({
        ...params,
        config: { ...params.config, abortSignal: controller.signal },
      }),
      deadline,
    ]);

    let text: unknown;
    try {
      text = response?.text;
    } catch {
      throw new UpstreamError("invalid_response");
    }
    if (typeof text !== "string" || text.trim() === "" || text.length > MAX_AI_TEXT_CHARS) {
      throw new UpstreamError("invalid_response");
    }
    return text;
  } catch (err) {
    throw classifyUpstreamError(err);
  } finally {
    clearTimeout(timer);
    // Avoid an unhandled rejection if the provider call settles after the deadline.
    deadline.catch(() => {});
  }
}
