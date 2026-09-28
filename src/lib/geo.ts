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

export function pathLengthMeters(points: { lat: number; lng: number }[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += haversineMeters(points[i - 1], points[i]);
  return sum;
}

export function polygonAreaM2(points: { lat: number; lng: number }[]) {
  if (points.length < 3) return 0;
  const R = 6371000;
  const ring = closeRing(points);
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    area += toRad(b.lng - a.lng) * (2 + Math.sin(toRad(a.lat)) + Math.sin(toRad(b.lat)));
  }
  return Math.abs((area * R * R) / 2);
}

export function polygonAcres(points: { lat: number; lng: number }[]) {
  const m2 = polygonAreaM2(points);
  if (m2 <= 0) return 0;
  return Math.round((m2 / 4046.8564224) * 100) / 100;
}

export type SurveyFix = { lat: number; lng: number; accuracy: number; at: number };

export function keepFenceFix(
  prev: SurveyFix | null,
  next: SurveyFix,
): "keep" | "skip-accuracy" | "skip-still" | "skip-jump" {
  if (next.accuracy > 20) return "skip-accuracy";
  if (!prev) return next.accuracy <= 12 ? "keep" : "skip-accuracy";
  if (next.accuracy > 15 && next.accuracy > prev.accuracy) return "skip-accuracy";
  const dist = haversineMeters(prev, next);
  if (dist < 2.5) return "skip-still";
  const dt = Math.max(0.4, (next.at - prev.at) / 1000);
  if (dist > 22 || dist / dt > 3.5) return "skip-jump";
  return "keep";
}
