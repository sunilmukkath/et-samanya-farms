import type { ObservationRow } from "@/db/schema";
import { timeAgo } from "@/lib/farm";

export type WaterSnapshot = {
  gaugeMm: number | null;
  gaugeWhen: string | null;
  gaugeSource: "sensor" | "logged" | null;
  pondLevel: string | null;
  pondWhen: string | null;
  pump: string | null;
  pumpWhen: string | null;
};

function isSensor(row: ObservationRow) {
  return row.source === "sensor" || Boolean(row.details?.sensorId);
}

export function onFarmWater(rows: ObservationRow[]): WaterSnapshot {
  const rain = rows.filter((row) => row.domain === "rain");
  const kit = rows.filter((row) => row.domain === "kit");
  const gauge =
    rain.find((row) => row.details?.rainMm != null && isSensor(row)) ??
    rain.find((row) => row.details?.rainMm != null);
  const pond = rain.find((row) => row.details?.pondLevel);
  const pump =
    rain.find((row) => row.details?.pumpOn != null || row.details?.irrigationMinutes != null) ??
    kit.find(
      (row) =>
        row.details?.irrigationMinutes != null ||
        row.details?.hours != null ||
        row.details?.kitItem?.toLowerCase().includes("pump"),
    );

  let pumpLine: string | null = null;
  if (pump?.details?.pumpOn === true) pumpLine = "Pump on";
  else if (pump?.details?.pumpOn === false) pumpLine = "Pump off";
  if (pump?.details?.irrigationMinutes != null) {
    pumpLine = `${pumpLine ? `${pumpLine} · ` : ""}${pump.details.irrigationMinutes} min drip`;
  } else if (pump?.details?.hours != null) {
    pumpLine = `${pumpLine ? `${pumpLine} · ` : ""}${pump.details.hours} hr runtime`;
  }

  return {
    gaugeMm: gauge?.details?.rainMm ?? null,
    gaugeWhen: gauge ? timeAgo(gauge.occurredAt) : null,
    gaugeSource: gauge ? (isSensor(gauge) ? "sensor" : "logged") : null,
    pondLevel: pond?.details?.pondLevel ?? null,
    pondWhen: pond ? timeAgo(pond.occurredAt) : null,
    pump: pumpLine,
    pumpWhen: pump ? timeAgo(pump.occurredAt) : null,
  };
}

export function waterHasValue(water: WaterSnapshot) {
  return water.gaugeMm != null || water.pondLevel != null || water.pump != null;
}
