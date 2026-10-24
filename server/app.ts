import express, { type Express, type RequestHandler } from "express";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { buildChatFallback, buildEvaluateFallback, isGeminiQuotaError } from "./fallbacks";
import { buildEvaluatePrompt, CHAT_SYSTEM_INSTRUCTION, EVALUATE_SYSTEM_INSTRUCTION } from "./prompts";

export const GEMINI_MODEL = "gemini-3.5-flash";

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
}

const QUIZ_ANSWER_VALUES = new Set(["safe", "unsafe", ""]);

export async function createApp(options: AppOptions): Promise<Express> {
  const app = express();
  app.disable("x-powered-by");
  const getGeminiClient = options.getGeminiClient;

  app.use(express.json());

  const aiLimiter = rateLimit({
    windowMs: options.rateLimit?.windowMs ?? 60 * 1000, // 1 menit
    limit: options.rateLimit?.limit ?? 10, // maksimal 10 request per menit per IP
    message: { success: false, error: "Terlalu banyak permintaan, coba lagi sebentar ya." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AyoDonor server running gracefully!" });
  });

  // Evaluate donor eligibility quiz with Gemini AI
  app.post("/api/gemini/evaluate", aiLimiter, async (req, res) => {
    const { ageWeight, sleep, meds, recency } = req.body;
    let { name } = req.body;

    if (
      typeof ageWeight !== "string" ||
      typeof sleep !== "string" ||
      typeof meds !== "string" ||
      typeof recency !== "string" ||
      !QUIZ_ANSWER_VALUES.has(ageWeight) ||
      !QUIZ_ANSWER_VALUES.has(sleep) ||
      !QUIZ_ANSWER_VALUES.has(meds) ||
      !QUIZ_ANSWER_VALUES.has(recency)
    ) {
      return res.status(400).json({ success: false, error: "Data jawaban kuis tidak valid." });
    }

    if (typeof name === "string" && name.length > 50) {
      name = name.substring(0, 50);
    } else if (name != null && typeof name !== "string") {
      name = undefined;
    }

    const client = getGeminiClient();

    // Eligibility check logic (all must be "safe")
    const isEligible = ageWeight === "safe" && sleep === "safe" && meds === "safe" && recency === "safe";

    if (!client) {
      return res.json({
        success: true,
        text: buildEvaluateFallback(name, ageWeight, sleep, meds, recency, isEligible),
      });
    }

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildEvaluatePrompt(name, ageWeight, sleep, meds, recency, isEligible),
        config: {
          systemInstruction: EVALUATE_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error("Gemini evaluate error:", err);
      if (isGeminiQuotaError(err)) {
        console.warn("Gemini quota/rate limit on evaluate — using local fallback.");
        return res.json({
          success: true,
          text: buildEvaluateFallback(name, ageWeight, sleep, meds, recency, isEligible),
        });
      }
      res.status(500).json({ error: "Gagal memproses evaluasi AI. Silakan coba lagi nanti!" });
    }
  });

  // Chat/Q&A Companion
  app.post("/api/gemini/chat", aiLimiter, async (req, res) => {
    const { message } = req.body;
    let history = req.body.history;

    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Pesan tidak boleh kosong." });
    }
    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Pesan terlalu panjang, coba dipersingkat ya (maks 500 karakter).",
      });
    }

    if (
      !Array.isArray(history) ||
      !history.every(
        (item: unknown) =>
          item != null &&
          typeof item === "object" &&
          typeof (item as { role?: unknown }).role === "string" &&
          typeof (item as { text?: unknown }).text === "string"
      )
    ) {
      history = [];
    }

    const client = getGeminiClient();

    if (!client) {
      return res.json({ success: true, text: buildChatFallback(message) });
    }

    try {
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          formattedContents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: formattedContents,
        config: {
          systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error("Gemini chat error FULL:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      if (isGeminiQuotaError(err)) {
        console.warn("Gemini quota/rate limit on chat — using local fallback.");
        return res.json({ success: true, text: buildChatFallback(message) });
      }
      res.status(500).json({ error: "Koneksi AI lagi sibuk nih, coba tanya sekali lagi ya!" });
    }
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

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
  });

  return app;
}
