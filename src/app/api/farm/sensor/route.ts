import { NextResponse } from "next/server";
import { canPersistFarmData } from "@/db/queries";
import { ingestDevicePayload, resolveDevice, type IngestBody } from "@/lib/iot/ingest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!canPersistFarmData()) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as IngestBody;
  const resolved = await resolveDevice(token, body.sensorId);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await ingestDevicePayload(resolved.device, body);
  return NextResponse.json(result);
}
