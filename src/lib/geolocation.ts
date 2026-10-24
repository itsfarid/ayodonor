import { isValidCoordinates } from "./geo";

// One-shot browser geolocation. The position stays in the browser: it is returned to the caller and never sent anywhere,
// logged, or cached by this module. It must only be called from an explicit user action (a button click).

export type LocateFailure = "unsupported" | "denied" | "timeout" | "unavailable" | "invalid";

export interface LocatedPosition {
  lat: number;
  lng: number;
  /** Radius in metres the browser claims for this fix, or null if it gave none. */
  accuracyM: number | null;
}

export type LocateResult = { ok: true; position: LocatedPosition } | { ok: false; reason: LocateFailure };

export const LOCATE_OPTIONS: PositionOptions = {
  // A coarse fix is enough to compare against cities and returns quickly on devices without GPS.
  enableHighAccuracy: false,
  timeout: 15_000,
  // Never accept a cached position: a stale fix must not be shown as the current one.
  maximumAge: 0,
};

/** Above this, the fix is too coarse (typical for IP/Wi-Fi positioning on desktops) to treat as "where you are". */
export const COARSE_ACCURACY_M = 20_000;

/** Resolves with a result for every outcome; it never rejects and never substitutes a default position. */
export function locate(geo: Geolocation | undefined = typeof navigator === "undefined" ? undefined : navigator.geolocation): Promise<LocateResult> {
  return new Promise((resolve) => {
    if (!geo || typeof geo.getCurrentPosition !== "function") {
      resolve({ ok: false, reason: "unsupported" });
      return;
    }
    try {
      geo.getCurrentPosition(
        (position) => {
          // Explicit mapping: latitude is the first coordinate, longitude the second.
          const lat = position?.coords?.latitude;
          const lng = position?.coords?.longitude;
          if (!isValidCoordinates(lat, lng)) {
            resolve({ ok: false, reason: "invalid" });
            return;
          }
          const accuracy = position.coords.accuracy;
          resolve({ ok: true, position: { lat, lng, accuracyM: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null } });
        },
        (error) => {
          // error.code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          resolve({ ok: false, reason: error?.code === 1 ? "denied" : error?.code === 3 ? "timeout" : "unavailable" });
        },
        LOCATE_OPTIONS
      );
    } catch {
      // Some browsers throw synchronously (e.g. insecure context).
      resolve({ ok: false, reason: "unavailable" });
    }
  });
}
