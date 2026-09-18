import type { DeviceMetrics, MetricValue } from "./equipment";

const RESERVED = new Set([
  "deviceId",
  "id",
  "token",
  "metrics",
  "state",
  "reportedState",
  "note",
  "lat",
  "lng",
  "photoUrl",
  "photoBase64",
  "mime",
  "occurredAt",
  "kind",
  "name",
]);

export type ParsedIngest = {
  deviceId: string | null;
  token: string | null;
  metrics: DeviceMetrics;
  state: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  photoBase64: string | null;
  mime: string | null;
  occurredAt: Date | null;
};

function asString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asMetric(value: unknown): MetricValue | undefined {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  return undefined;
}

export function bearerToken(header: string | null | undefined) {
  if (!header) return null;
  const trimmed = header.trim();
  const match = /^(Bearer|Token)\s+(.+)$/i.exec(trimmed);
  return (match?.[2] ?? trimmed).trim() || null;
}

export function parseIngestPayload(body: unknown, headerToken?: string | null): ParsedIngest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Send a JSON object." };
  const raw = body as Record<string, unknown>;
  const nested =
    raw.metrics && typeof raw.metrics === "object" && !Array.isArray(raw.metrics)
      ? (raw.metrics as Record<string, unknown>)
      : {};

  const metrics: DeviceMetrics = {};
  for (const [key, value] of Object.entries(nested)) {
    const metric = asMetric(value);
    if (metric !== undefined) metrics[key] = metric;
  }
  for (const [key, value] of Object.entries(raw)) {
    if (RESERVED.has(key)) continue;
    const metric = asMetric(value);
    if (metric !== undefined) metrics[key] = metric;
  }

  const occurredRaw = asString(raw.occurredAt);
  let occurredAt: Date | null = null;
  if (occurredRaw) {
    const date = new Date(occurredRaw);
    if (Number.isNaN(date.getTime())) return { error: "occurredAt is not a date." };
    occurredAt = date;
  }

  return {
    deviceId: asString(raw.deviceId) ?? asString(raw.id),
    token: asString(raw.token) ?? headerToken ?? null,
    metrics,
    state: asString(raw.state) ?? asString(raw.reportedState),
    note: asString(raw.note),
    lat: asNumber(raw.lat),
    lng: asNumber(raw.lng),
    photoUrl: asString(raw.photoUrl),
    photoBase64: asString(raw.photoBase64),
    mime: asString(raw.mime) ?? "image/jpeg",
    occurredAt,
  };
}

export function commandFromDevice(desiredState: string | null | undefined) {
  if (desiredState === "on" || desiredState === "off") {
    return { action: desiredState, desiredState };
  }
  return { action: null as string | null, desiredState: desiredState ?? null };
}
