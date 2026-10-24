import { randomUUID } from "crypto";
import express, { type Express, type RequestHandler, type Response } from "express";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { errorBody, errorHandler } from "./errors";
import { buildChatFallback, buildEvaluateFallback } from "./fallbacks";
import { generateText, UpstreamError, type UpstreamFailureKind } from "./gemini";
import { logEvent } from "./logger";
import { buildEvaluatePrompt, CHAT_SYSTEM_INSTRUCTION, EVALUATE_SYSTEM_INSTRUCTION } from "./prompts";
import { LIMITS, validateChat, validateEvaluate } from "./validation";

export const GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_GEMINI_TIMEOUT_MS = 20_000;

/** The small slice of the @google/genai client that the app depends on. */
export interface GeminiClientLike {
  models: {
    generateContent(params: any): Promise<{ text?: string }>;
  };
}

export interface AppOptions {
  mode: "development" | "production";
  /** Returns the Gemini client, or null when the API key is not configured. */
  getGeminiClient: () => GeminiClientLike | null;
  /** Development only: creates the middleware that serves the Vite dev build. */
  createDevMiddleware?: () => Promise<RequestHandler>;
  staticDir?: string;
  rateLimit?: { windowMs: number; limit: number };
  /** Hard deadline for one Gemini call. */
  geminiTimeoutMs?: number;
  /** Emit one structured log line per request (no bodies, no query strings). Default true. */
  logRequests?: boolean;
}

/** Where an answer came from, so the UI can never present a canned reply as live AI. */
export type AnswerSource = "ai" | "fallback";
export type FallbackReason = "unconfigured" | "quota";

function sendText(res: Response, text: string, source: AnswerSource, fallbackReason?: FallbackReason) {
  res.json({ success: true, source, ...(fallbackReason ? { fallbackReason } : {}), text });
}

const UPSTREAM_RESPONSES: Record<Exclude<UpstreamFailureKind, "quota">, { status: number; code: string; error: string }> = {
  timeout: { status: 504, code: "upstream_timeout", error: "AI terlalu lama merespons. Coba lagi sebentar ya." },
  network: { status: 502, code: "upstream_unavailable", error: "AI sedang tidak bisa dihubungi. Coba lagi nanti ya." },
  invalid_response: { status: 502, code: "upstream_invalid_response", error: "AI memberi jawaban yang tidak bisa dipakai. Coba lagi ya." },
  upstream_error: { status: 502, code: "upstream_unavailable", error: "AI sedang bermasalah. Coba lagi nanti ya." },
};

export async function createApp(options: AppOptions): Promise<Express> {
  const app = express();
  app.disable("x-powered-by");
  const getGeminiClient = options.getGeminiClient;
  const timeoutMs = options.geminiTimeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS;

  // Request ID + one structured log line per request (never bodies or query strings).
  app.use((req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    if (options.logRequests !== false) {
      const started = process.hrtime.bigint();
      res.on("finish", () => {
        logEvent("info", "request", {
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n),
        });
      });
    }
    next();
  });

  const aiLimiter = rateLimit({
    windowMs: options.rateLimit?.windowMs ?? 60 * 1000, // 1 menit
    limit: options.rateLimit?.limit ?? 10, // maksimal 10 request per menit per IP
    message: errorBody("rate_limited", "Terlalu banyak permintaan, coba lagi sebentar ya."),
    standardHeaders: true,
    legacyHeaders: false,
  });

  /** Runs one Gemini call and writes either the AI text, a labelled quota fallback, or a safe error. */
  async function answer(
    res: Response,
    endpoint: "evaluate" | "chat",
    client: GeminiClientLike,
    params: any,
    quotaFallback: () => string
  ) {
    const started = Date.now();
    try {
      const text = await generateText(client, params, timeoutMs);
      return sendText(res, text, "ai");
    } catch (err) {
      const failure = err instanceof UpstreamError ? err : new UpstreamError("upstream_error");
      logEvent(failure.kind === "quota" ? "warn" : "error", "gemini_failure", {
        requestId: res.locals.requestId,
        endpoint,
        kind: failure.kind,
        upstreamStatus: failure.upstreamStatus,
        durationMs: Date.now() - started,
      });
      if (failure.kind === "quota") {
        // Quota exhaustion is answered with the canned reply, explicitly labelled as a fallback.
        return sendText(res, quotaFallback(), "fallback", "quota");
      }
      const mapped = UPSTREAM_RESPONSES[failure.kind];
      return res.status(mapped.status).json(errorBody(mapped.code, mapped.error));
    }
  }

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AyoDonor server running gracefully!" });
  });

  // Evaluate donor eligibility quiz with Gemini AI
  // The limiter runs before the body parser so malformed or oversized requests count too.
  app.post("/api/gemini/evaluate", aiLimiter, express.json({ limit: LIMITS.evaluateBodyBytes }), async (req, res) => {
    const parsed = validateEvaluate(req.body);
    if ("error" in parsed) {
      return res.status(400).json(errorBody("invalid_request", parsed.error));
    }
    const { name, ageWeight, sleep, meds, recency } = parsed.value;

    const client = getGeminiClient();

    // Eligibility check logic (all must be "safe")
    const isEligible = ageWeight === "safe" && sleep === "safe" && meds === "safe" && recency === "safe";
    const fallback = () => buildEvaluateFallback(name, ageWeight, sleep, meds, recency, isEligible);

    if (!client) {
      return sendText(res, fallback(), "fallback", "unconfigured");
    }

    return answer(
      res,
      "evaluate",
      client,
      {
        model: GEMINI_MODEL,
        contents: buildEvaluatePrompt(name, ageWeight, sleep, meds, recency, isEligible),
        config: { systemInstruction: EVALUATE_SYSTEM_INSTRUCTION },
      },
      fallback
    );
  });

  // Chat/Q&A Companion
  app.post("/api/gemini/chat", aiLimiter, express.json({ limit: LIMITS.chatBodyBytes }), async (req, res) => {
    const parsed = validateChat(req.body);
    if ("error" in parsed) {
      return res.status(400).json(errorBody("invalid_request", parsed.error));
    }
    const { message, history } = parsed.value;

    const client = getGeminiClient();
    const fallback = () => buildChatFallback(message);

    if (!client) {
      return sendText(res, fallback(), "fallback", "unconfigured");
    }

    const contents = history.map((h) => ({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: "user", parts: [{ text: message }] });

    return answer(
      res,
      "chat",
      client,
      {
        model: GEMINI_MODEL,
        contents,
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION },
      },
      fallback
    );
  });

  // --- Static Asset Serving & Dev Server Setup ---

  if (options.mode === "development") {
    if (!options.createDevMiddleware) {
      throw new Error("createDevMiddleware is required in development mode.");
    }
    app.use(await options.createDevMiddleware());
  } else {
    const staticDir = options.staticDir ?? path.join(process.cwd(), "dist", "public");
    const indexFile = path.join(staticDir, "index.html");
    if (!fs.existsSync(indexFile)) {
      throw new Error(
        `Production build not found: ${indexFile} is missing. Run "npm run build" before starting in production mode.`
      );
    }

    // Defense in depth: never serve dotfiles (.env*) or source maps, even if one
    // ends up inside the public directory by mistake.
    app.use((req, res, next) => {
      if (/(^|\/)\./.test(req.path) || /\.map$/i.test(req.path)) {
        return res.status(404).type("text/plain").send("Not found");
      }
      next();
    });
    app.use(express.static(staticDir, { index: false, dotfiles: "ignore" }));

    // Unknown API routes must not fall through to the SPA shell.
    app.use("/api", (req, res) => {
      res.status(404).json({ success: false, error: "Endpoint tidak ditemukan." });
    });

    // SPA routes only: extension-less GET paths get index.html; missing files get a real 404.
    app.get("*", (req, res, next) => {
      if (path.extname(req.path)) return next();
      res.sendFile(indexFile);
    });
    app.use((req, res) => {
      res.status(404).type("text/plain").send("Not found");
    });
  }

  app.use(errorHandler);

  return app;
}
