import { DUPLICATE_TREE_METERS } from "@/lib/farm";

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function nearestPoints<T extends { lat: number; lng: number }>(
  point: { lat: number; lng: number },
  items: T[],
  withinMeters = DUPLICATE_TREE_METERS,
) {
  return items
    .map((item) => ({ item, meters: haversineMeters(point, item) }))
    .filter((entry) => entry.meters <= withinMeters)
    .sort((a, b) => a.meters - b.meters);
}

export function closeRing(points: { lat: number; lng: number }[]) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) return points;
  return [...points, first];
}
