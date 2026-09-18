import type { DeviceRow } from "@/db/schema";
import { insertReading, updateDevice } from "@/db/queries";
import type { ParsedIngest } from "@/lib/ingest";

export async function applyDeviceIngest(
  device: DeviceRow,
  parsed: ParsedIngest,
  photoUrl: string | null,
) {
  const occurredAt = parsed.occurredAt ?? new Date();
  const metrics = parsed.metrics;
  const reading = await insertReading({
    deviceId: device.id,
    occurredAt,
    metrics,
    photoUrl,
    note: parsed.note,
    lat: parsed.lat,
    lng: parsed.lng,
  });

  await updateDevice(device.id, {
    status: "online",
    lastSeenAt: occurredAt,
    lastMetrics: Object.keys(metrics).length ? metrics : device.lastMetrics,
    reportedState: parsed.state ?? device.reportedState,
    snapshotUrl: photoUrl ?? device.snapshotUrl,
    lat: parsed.lat ?? device.lat,
    lng: parsed.lng ?? device.lng,
  });

  return reading;
}
