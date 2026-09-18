import { NextResponse } from "next/server";
import { canPersistFarmData, insertObservation } from "@/db/queries";
import { isObservationDomain } from "@/lib/farm";
import { getFarmWeather, weatherSnapshot } from "@/lib/weather";
import type { ObservationDetails, ObservationDomain, ObservationSource } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.FARM_SENSOR_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Sensor ingest is off." }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canPersistFarmData()) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 503 });
  }

  const body = (await request.json()) as {
    domain?: string;
    note?: string;
    lat?: number;
    lng?: number;
    sensorId?: string;
    source?: ObservationSource;
    details?: ObservationDetails;
  };

  const domain = body.domain ?? "rain";
  if (!isObservationDomain(domain)) {
    return NextResponse.json({ error: "Unknown domain" }, { status: 400 });
  }

  const weather = weatherSnapshot(await getFarmWeather());
  const details: ObservationDetails = { ...(body.details ?? {}), sensorId: body.sensorId };
  await insertObservation({
    domain: domain as ObservationDomain,
    occurredAt: new Date(),
    note: body.note ?? null,
    photoUrl: null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    accuracyM: null,
    weather,
    details,
    treeId: null,
    plotId: null,
    animalId: null,
    source: body.source === "drone" ? "drone" : "sensor",
    createdBy: body.sensorId ?? "sensor",
  });

  return NextResponse.json({ ok: true });
}
