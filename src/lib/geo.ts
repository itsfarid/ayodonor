// Coordinate validation and straight-line distance. Pure functions; nothing here reads the browser or the network.

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * True only for finite numbers inside the valid ranges. (0, 0) is rejected as well: it is the value broken
 * position sources return when they have nothing. Indonesian longitudes (95 to 141) are outside the latitude range,
 * so a swapped pair for any Indonesian position fails here instead of producing a plausible-looking wrong distance.
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle (Haversine) distance in km between two valid points. Not a driving or walking distance. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance in km, or null when either point is not a valid coordinate pair. Never guesses. */
export function distanceKm(a: LatLng | null | undefined, b: LatLng | null | undefined): number | null {
  if (!a || !b) return null;
  if (!isValidCoordinates(a.lat, a.lng) || !isValidCoordinates(b.lat, b.lng)) return null;
  return haversineKm(a, b);
}

export interface WithDistance<T> {
  item: T;
  km: number | null;
}

/**
 * Ascending by distance. Items without a valid distance keep their original order after all measured items,
 * so an unmeasured item can never be ranked above a measured one.
 */
export function sortByDistance<T>(items: readonly T[], origin: LatLng | null, coordsOf: (item: T) => LatLng | null | undefined): WithDistance<T>[] {
  const measured = items.map((item, index) => ({ item, index, km: distanceKm(origin, coordsOf(item)) }));
  return measured
    .sort((x, y) => {
      if (x.km === null && y.km === null) return x.index - y.index;
      if (x.km === null) return 1;
      if (y.km === null) return -1;
      return x.km - y.km || x.index - y.index;
    })
    .map(({ item, km }) => ({ item, km }));
}
