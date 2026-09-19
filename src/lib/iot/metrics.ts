import type { DeviceKind, ObservationDomain } from "@/db/schema";

export const metricUnits: Record<string, string> = {
  "soil.moisture_pct": "%",
  "soil.temp_c": "°C",
  "pond.level_m": "m",
  "tank.level_m": "m",
  "rain.mm": "mm",
  "pump.on": "",
  "batt.v": "V",
  "rssi.dbm": "dBm",
  "air.temp_c": "°C",
  "air.humidity_pct": "%",
};

export function defaultMetric(kind: DeviceKind) {
  if (kind === "soil") return "soil.moisture_pct";
  if (kind === "pond") return "pond.level_m";
  if (kind === "tank") return "tank.level_m";
  if (kind === "weather") return "rain.mm";
  if (kind === "pump" || kind === "valve") return "pump.on";
  return "batt.v";
}

export function domainForDeviceKind(kind: DeviceKind): ObservationDomain {
  if (kind === "soil") return "soil";
  if (kind === "pond" || kind === "tank" || kind === "weather") return "rain";
  if (kind === "pump" || kind === "valve") return "kit";
  return "kit";
}

export function observationDetailsForReading(kind: DeviceKind, metric: string, value: number) {
  if (metric === "pond.level_m" || (kind === "pond" && metric.includes("level"))) {
    return { pondLevel: value < 0.4 ? "Low" : value < 1.2 ? "Ok" : "High" };
  }
  if (metric === "tank.level_m") {
    return { tankLevel: value < 0.3 ? "Low" : value < 0.8 ? "Ok" : "High" };
  }
  if (metric === "rain.mm") return { rainMm: value };
  if (metric === "soil.moisture_pct") {
    return { moisture: value < 18 ? "Dry" : value > 40 ? "Wet" : "Ok" };
  }
  if (metric === "pump.on") return { pumpOn: value >= 1 };
  return {};
}
