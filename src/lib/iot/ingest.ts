import {
  getDeviceByTokenHash,
  insertObservation,
  insertReading,
  updateDevice,
} from "@/db/queries";
import type { DeviceRow, ObservationDetails, ObservationDomain } from "@/db/schema";
import { isObservationDomain } from "@/lib/farm";
import { defaultMetric, domainForDeviceKind, observationDetailsForReading } from "@/lib/iot/metrics";
import { evaluateFarmRules } from "@/lib/iot/rules";
import { hashDeviceToken } from "@/lib/iot/tokens";
import { getFarmWeather, weatherSnapshot } from "@/lib/weather";

export type IngestBody = {
  domain?: string;
  note?: string;
  lat?: number;
  lng?: number;
  sensorId?: string;
  source?: "sensor" | "drone";
  details?: ObservationDetails;
  metric?: string;
  value?: number;
  unit?: string;
  batteryV?: number;
  rssi?: number;
  observation?: boolean;
  firmware?: string;
};

export async function resolveDevice(bearer: string, sensorId?: string) {
  const farmToken = process.env.FARM_SENSOR_TOKEN;
  const edgeToken = process.env.FARM_EDGE_TOKEN;
  if (farmToken && bearer === farmToken) {
    if (!sensorId) return { ok: false as const, status: 400, error: "sensorId required with farm token." };
    const hashed = hashDeviceToken(`legacy:${sensorId}`);
    let device = await getDeviceByTokenHash(hashed);
    if (!device) {
      const { insertDevice } = await import("@/db/queries");
      device = await insertDevice({
        name: sensorId,
        kind: "pond",
        protocol: "http",
        tokenHash: hashed,
        plotId: null,
        plantStandId: null,
        treeId: null,
        animalId: null,
        lat: null,
        lng: null,
        firmware: null,
        lastSeenAt: new Date(),
        batteryV: null,
        rssi: null,
        config: { legacy: true },
        status: "online",
      });
    }
    return { ok: true as const, device };
  }
  if (edgeToken && bearer === edgeToken) {
    if (!sensorId) return { ok: false as const, status: 400, error: "sensorId required with edge token." };
    const device = await getDeviceByTokenHash(hashDeviceToken(sensorId)).catch(() => null);
    if (device) return { ok: true as const, device };
    const byId = await import("@/db/queries").then((mod) => mod.getDevice(sensorId));
    if (byId) return { ok: true as const, device: byId };
    return { ok: false as const, status: 401, error: "Unknown node." };
  }
  const device = await getDeviceByTokenHash(hashDeviceToken(bearer));
  if (!device) return { ok: false as const, status: 401, error: "Unauthorized" };
  return { ok: true as const, device };
}

export async function ingestDevicePayload(device: DeviceRow, body: IngestBody) {
  const metric = body.metric || defaultMetric(device.kind);
  const value =
    body.value ??
    body.details?.rainMm ??
    (typeof body.details?.pondLevel === "number" ? body.details.pondLevel : undefined) ??
    (body.details?.pumpOn == null ? undefined : body.details.pumpOn ? 1 : 0);
  const now = new Date();
  await updateDevice(device.id, {
    lastSeenAt: now,
    batteryV: body.batteryV ?? device.batteryV,
    rssi: body.rssi ?? device.rssi,
    firmware: body.firmware ?? device.firmware,
    lat: body.lat ?? device.lat,
    lng: body.lng ?? device.lng,
    status: "online",
  });

  let reading = null;
  if (value != null && Number.isFinite(Number(value))) {
    reading = await insertReading({
      deviceId: device.id,
      metric,
      value: Number(value),
      unit: body.unit ?? null,
      recordedAt: now,
      payload: (body.details as Record<string, unknown> | undefined) ?? null,
    });
    await evaluateFarmRules({ device, reading }).catch(() => undefined);
  }

  const wantsObservation = Boolean(body.note || body.observation || body.domain);
  if (wantsObservation) {
    const domainRaw = body.domain ?? domainForDeviceKind(device.kind);
    if (isObservationDomain(domainRaw)) {
      const weather = weatherSnapshot(await getFarmWeather());
      const details: ObservationDetails = {
        ...(body.details ?? {}),
        ...(reading ? observationDetailsForReading(device.kind, metric, reading.value) : {}),
        sensorId: body.sensorId ?? device.id,
        deviceId: device.id,
      };
      await insertObservation({
        domain: domainRaw as ObservationDomain,
        occurredAt: now,
        note: body.note ?? null,
        photoUrl: null,
        lat: body.lat ?? device.lat,
        lng: body.lng ?? device.lng,
        accuracyM: null,
        weather,
        details,
        treeId: device.treeId,
        plotId: device.plotId,
        animalId: device.animalId,
        plantStandId: device.plantStandId,
        source: body.source === "drone" ? "drone" : "sensor",
        createdBy: body.sensorId ?? device.id,
      });
    }
  }

  return { ok: true as const, deviceId: device.id, readingId: reading?.id ?? null };
}
