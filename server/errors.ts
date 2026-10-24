import type { ErrorRequestHandler } from "express";
import { logEvent } from "./logger";

export interface ErrorBody {
  success: false;
  error: string;
  code: string;
}

export function errorBody(code: string, error: string): ErrorBody {
  return { success: false, error, code };
}

/**
 * Last-resort Express error handler. Maps body-parser failures to proper 4xx
 * responses and hides everything else behind a generic 500. Only the error
 * *type* and status are logged: never the message, stack or request body.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const type = typeof err?.type === "string" ? err.type : undefined;
  const status = typeof err?.status === "number" ? err.status : undefined;

  let httpStatus = 500;
  let body = errorBody("internal_error", "Terjadi kesalahan pada server.");

  if (type === "entity.too.large") {
    httpStatus = 413;
    body = errorBody("payload_too_large", "Permintaan terlalu besar.");
  } else if (type === "entity.parse.failed") {
    httpStatus = 400;
    body = errorBody("invalid_json", "Format JSON tidak valid.");
  } else if (type === "encoding.unsupported" || type === "charset.unsupported") {
    httpStatus = 415;
    body = errorBody("unsupported_encoding", "Encoding permintaan tidak didukung.");
  } else if (status !== undefined && status >= 400 && status < 500) {
    httpStatus = status;
    body = errorBody("bad_request", "Permintaan tidak valid.");
  }

  logEvent(httpStatus >= 500 ? "error" : "warn", "request_error", {
    method: req.method,
    path: req.path,
    status: httpStatus,
    errorType: type ?? (err instanceof Error ? err.name : typeof err),
  });

  if (res.headersSent) return;
  res.status(httpStatus).json(body);
};
