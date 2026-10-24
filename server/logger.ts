type Level = "info" | "warn" | "error";
type Fields = Record<string, string | number | boolean | undefined>;

/**
 * Structured one-line JSON logging. Fields are limited to primitives on purpose so
 * request bodies, error objects and provider responses cannot be dumped by accident.
 * Never pass donor answers, names, chat text or secrets.
 */
export function logEvent(level: Level, event: string, fields: Fields = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
