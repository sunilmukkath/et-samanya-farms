import {
  getDevice,
  insertFirmware,
  listFirmware,
  updateDevice,
} from "@/db/queries";
import type { DeviceKind } from "@/db/schema";

export async function latestFirmware(kind: DeviceKind) {
  const rows = await listFirmware();
  return rows.find((row) => row.deviceKind === kind) ?? null;
}

export async function registerFirmware(input: {
  deviceKind: DeviceKind;
  version: string;
  url: string;
  sha256?: string | null;
  notes?: string | null;
}) {
  return insertFirmware({
    deviceKind: input.deviceKind,
    version: input.version,
    url: input.url,
    sha256: input.sha256 ?? null,
    notes: input.notes ?? null,
  });
}

export async function otaCommand(deviceId: string) {
  const device = await getDevice(deviceId);
  if (!device) return null;
  const artifact = await latestFirmware(device.kind);
  if (!artifact) return null;
  return {
    topic: `farm/${device.id}/ota`,
    payload: {
      version: artifact.version,
      url: artifact.url,
      sha256: artifact.sha256,
    },
  };
}

const MAX_ON_MS = 15 * 60 * 1000;

export function actuationAllowed(command: string, lastHeartbeatAt: Date | null) {
  if (!lastHeartbeatAt || Date.now() - lastHeartbeatAt.getTime() > 5 * 60 * 1000) {
    return { ok: false as const, error: "Node heartbeat is stale. Will not send a command." };
  }
  if (command === "on") {
    return { ok: true as const, maxOnMs: MAX_ON_MS };
  }
  return { ok: true as const, maxOnMs: 0 };
}

export async function recordActuation(deviceId: string, command: string) {
  await updateDevice(deviceId, {
    config: { lastCommand: command, lastCommandAt: new Date().toISOString() },
  });
}
