import {
  insertAlert,
  insertTask,
  listDevices,
  listReadings,
  markStaleDevices,
} from "@/db/queries";
import type { DeviceKind, DeviceRow, ObservationDomain, ReadingRow } from "@/db/schema";
import type { FarmRule } from "@/lib/packs/types";
import { getFarmProfile } from "@/lib/profile";

function latestFor(device: DeviceRow, readings: ReadingRow[], metric?: string) {
  return readings.find(
    (row) => row.deviceId === device.id && (!metric || row.metric === metric),
  );
}

function matches(rule: FarmRule, device: DeviceRow, reading: ReadingRow | undefined, now: number) {
  if (rule.when.deviceKind && device.kind !== rule.when.deviceKind) return false;
  if (rule.when.op === "silent") {
    const minutes = rule.when.durationMin ?? 120;
    const seen = device.lastSeenAt ? device.lastSeenAt.getTime() : 0;
    return !seen || now - seen >= minutes * 60_000;
  }
  if (!reading || (rule.when.metric && reading.metric !== rule.when.metric)) return false;
  const value = reading.value;
  const threshold = rule.when.value ?? 0;
  if (rule.when.op === "lt") return value < threshold;
  if (rule.when.op === "gt") return value > threshold;
  if (rule.when.op === "eq") return value === threshold;
  return false;
}

export async function evaluateFarmRules(input?: { device?: DeviceRow; reading?: ReadingRow }) {
  const profile = await getFarmProfile();
  const rules = profile.rules.filter((rule) => rule.enabled);
  if (!rules.length) return;
  await markStaleDevices();
  const devices = input?.device ? [input.device] : await listDevices();
  const readings = input?.reading
    ? [input.reading]
    : await listReadings({ limit: 400 });
  const now = Date.now();

  for (const device of devices) {
    for (const rule of rules) {
      const reading = input?.reading ?? latestFor(device, readings, rule.when.metric);
      if (!matches(rule, device, reading, now)) continue;
      await insertTask({
        title: `${rule.then.task}${device.name ? ` · ${device.name}` : ""}`,
        dueAt: new Date(),
        source: "ai",
        domain: (rule.then.domain ?? "kit") as ObservationDomain,
        treeId: device.treeId,
        plotId: device.plotId,
        animalId: device.animalId,
        completedAt: null,
        completedObservationId: null,
      });
      if (rule.then.alert) {
        await insertAlert({
          title: rule.then.alert,
          detail: `${device.name} (${device.kind as DeviceKind})`,
          deviceId: device.id,
          ruleId: rule.id,
          acknowledgedAt: null,
        });
      }
    }
  }
}
