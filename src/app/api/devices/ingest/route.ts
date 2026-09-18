import { applyDeviceIngest } from "@/lib/devices";
import { canPersistFarmData, getDevice, getDeviceByToken } from "@/db/queries";
import { commandFromDevice, bearerToken, parseIngestPayload } from "@/lib/ingest";
import { uploadPhoto } from "@/lib/photos";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function resolveDevice(token: string | null, deviceId: string | null) {
  if (!token) return null;
  const byToken = await getDeviceByToken(token);
  if (byToken) return byToken;
  if (!deviceId) return null;
  const byId = await getDevice(deviceId);
  if (byId && byId.token === token) return byId;
  return null;
}

export async function GET(request: NextRequest) {
  if (!canPersistFarmData()) {
    return json({ error: "Farm store is not ready." }, 503);
  }
  const token = bearerToken(request.headers.get("authorization")) ?? request.nextUrl.searchParams.get("token");
  const deviceId = request.nextUrl.searchParams.get("deviceId") ?? request.nextUrl.searchParams.get("id");
  const device = await resolveDevice(token, deviceId);
  if (!device) return json({ error: "Unknown device token." }, 401);
  return json({
    ok: true,
    deviceId: device.id,
    kind: device.kind,
    name: device.name,
    command: commandFromDevice(device.desiredState),
    reportedState: device.reportedState,
  });
}

export async function POST(request: NextRequest) {
  if (!canPersistFarmData()) {
    return json({ error: "Farm store is not ready." }, 503);
  }

  let body: unknown = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }
  }

  const headerToken =
    bearerToken(request.headers.get("authorization")) ?? request.nextUrl.searchParams.get("token");
  const parsed = parseIngestPayload(body, headerToken);
  if ("error" in parsed) return json({ error: parsed.error }, 400);

  const device = await resolveDevice(parsed.token, parsed.deviceId);
  if (!device) return json({ error: "Unknown device token." }, 401);

  let photoUrl = parsed.photoUrl;
  if (!photoUrl && parsed.photoBase64) {
    try {
      const buffer = Buffer.from(parsed.photoBase64, "base64");
      const file = new File([buffer], "snapshot.jpg", { type: parsed.mime || "image/jpeg" });
      photoUrl = await uploadPhoto(file);
    } catch {
      return json({ error: "Could not store the photo." }, 400);
    }
  }

  const reading = await applyDeviceIngest(device, parsed, photoUrl);
  const fresh = (await getDevice(device.id)) ?? device;

  return json({
    ok: true,
    deviceId: device.id,
    readingId: reading.id,
    command: commandFromDevice(fresh.desiredState),
  });
}
