import {
  canPersistFarmData,
  latestReadings,
  listDevices,
  listObservations,
  listPlantStands,
  listPlots,
  listTrees,
} from "@/db/queries";
import type { DeviceRow, ObservationRow, PlantStandRow, PlotRow, ReadingRow, TreeRow } from "@/db/schema";
import { phiHolds, phiLabel } from "@/lib/phi";
import { getRuntimeFarm } from "@/lib/profile";
import { latestSatelliteLook, type SatelliteLook } from "@/lib/satellite";
import { getFarmWeather, todayRainMm, type FarmWeather, type WeatherDay } from "@/lib/weather";

export type GuideScale = "farm" | "home";

export type ZoneBand = "strong" | "mixed" | "thin" | "empty";

export type FieldZone = {
  id: string;
  name: string;
  band: ZoneBand;
  score: number | null;
  detail: string;
  action: string;
};

export type CropOutlook = {
  crop: string;
  stage: string | null;
  harvested: string | null;
  line: string;
};

export type WaterCall = {
  title: string;
  detail: string;
  tone: "water" | "wait" | "check";
};

export type MarketPick = {
  crop: string;
  qty: string;
  destination: string | null;
};

export type RecentIssue = {
  id: string;
  crop: string;
  issue: string;
  cause: string | null;
  step: string | null;
  when: string;
};

export type FieldGuide = {
  scale: GuideScale;
  acres: number | null;
  place: string;
  advisories: string[];
  zones: FieldZone[];
  outlook: CropOutlook[];
  water: WaterCall[];
  marketLine: string;
  picks: MarketPick[];
  issues: RecentIssue[];
  satellite: SatelliteLook | null;
  satelliteLine: string;
  brief: string;
};

const HEALTH_SCORE: Record<string, number> = {
  healthy: 1,
  watch: 0.55,
  stressed: 0.25,
  dead: 0,
};

const TENDER = ["greens", "spinach", "keerai", "coriander", "lettuce", "herb", "pudina", "mint", "basil", "amaranth"];

export function resolveGuideScale(raw: string | undefined, acres: number | null): GuideScale {
  if (raw === "home" || raw === "farm") return raw;
  if (acres != null && acres > 0 && acres <= 0.5) return "home";
  return "farm";
}

export async function loadFieldGuide(scale: GuideScale, opts?: { satellite?: boolean }): Promise<FieldGuide> {
  const runtime = await getRuntimeFarm();
  const persist = canPersistFarmData();
  const since = new Date(Date.now() - 90 * 86_400_000);
  const [plots, trees, stands, observations, devices, readings, weather, satellite] = await Promise.all([
    persist ? listPlots() : Promise.resolve([] as PlotRow[]),
    persist ? listTrees() : Promise.resolve([] as TreeRow[]),
    persist ? listPlantStands() : Promise.resolve([] as PlantStandRow[]),
    persist ? listObservations({ since, limit: 400 }) : Promise.resolve([] as ObservationRow[]),
    persist ? listDevices() : Promise.resolve([] as DeviceRow[]),
    persist ? latestReadings() : Promise.resolve([] as ReadingRow[]),
    getFarmWeather(),
    scale === "farm" && opts?.satellite !== false
      ? latestSatelliteLook(runtime.location.lat, runtime.location.lng)
      : Promise.resolve(null),
  ]);

  return assembleFieldGuide({
    scale,
    acres: runtime.acres,
    place: runtime.location.village || runtime.shortName,
    plots,
    trees,
    stands,
    observations,
    devices,
    readings,
    weather,
    satellite,
    now: new Date(),
  });
}

export function assembleFieldGuide(input: {
  scale: GuideScale;
  acres: number | null;
  place: string;
  plots: PlotRow[];
  trees: TreeRow[];
  stands: PlantStandRow[];
  observations: ObservationRow[];
  devices: DeviceRow[];
  readings: ReadingRow[];
  weather: FarmWeather | null;
  satellite: SatelliteLook | null;
  now?: Date;
}): FieldGuide {
  const now = input.now ?? new Date();
  const todayDate = input.weather?.todayDate ?? calendarDate(now);
  const today = input.weather?.week.find((day) => day.date === todayDate) ?? null;
  const tomorrow = dayOn(input.weather, todayDate, 1);
  const issues = recentIssues(input.observations, now);
  const zones = fieldZones(input);
  const outlook = cropOutlook(input, today, tomorrow);
  const water = waterCalls(input, today, tomorrow);
  const picks = recentPicks(input.observations, now);
  const marketLine = marketAdvice(picks, tomorrow, input.scale);
  const advisories = buildAdvisories({
    scale: input.scale,
    weather: input.weather,
    today,
    tomorrow,
    observations: input.observations,
    zones,
    water,
    now,
  });
  const satelliteLine =
    input.scale === "home"
      ? "Pots and balcony beds are scored from your notes. A satellite pixel is larger than a terrace."
      : input.satellite
        ? `Sentinel-2 passed on ${input.satellite.when}${input.satellite.cloud != null ? `, about ${input.satellite.cloud}% cloud` : ""}. Zone scores still use stem health, sick-crop notes, and pick weights.`
        : "Zone scores use stem health, sick-crop notes, and pick weights on each plot.";

  const guide: FieldGuide = {
    scale: input.scale,
    acres: input.acres,
    place: input.place,
    advisories,
    zones,
    outlook,
    water,
    marketLine,
    picks,
    issues,
    satellite: input.satellite,
    satelliteLine,
    brief: "",
  };
  guide.brief = [
    `Scale: ${input.scale === "home" ? "home garden" : "farm"} at ${input.place}.`,
    ...advisories,
    ...zones.slice(0, 6).map((zone) => `${zone.name} is ${zone.band}. ${zone.action}`),
    ...water.map((call) => `${call.title}. ${call.detail}`),
    marketLine,
    ...outlook.slice(0, 4).map((row) => row.line),
  ].join("\n");
  return guide;
}

function fieldZones(input: {
  scale: GuideScale;
  plots: PlotRow[];
  trees: TreeRow[];
  observations: ObservationRow[];
}): FieldZone[] {
  const home = input.scale === "home";
  const assigned = new Map<string, TreeRow[]>();
  const loose: TreeRow[] = [];
  for (const tree of input.trees) {
    const plotId = plotIdForPoint(tree.lng, tree.lat, input.plots);
    if (!plotId) loose.push(tree);
    else assigned.set(plotId, [...(assigned.get(plotId) ?? []), tree]);
  }

  const zones = input.plots.map((plot) =>
    scoreZone({
      id: plot.id,
      name: plot.name,
      trees: assigned.get(plot.id) ?? [],
      notes: input.observations.filter((row) => row.plotId === plot.id),
      home,
    }),
  );

  if (!zones.length) {
    zones.push(
      scoreZone({
        id: "land",
        name: home ? "Pots and kitchen beds" : "This land",
        trees: input.trees,
        notes: input.observations,
        home,
      }),
    );
  } else if (loose.length) {
    zones.push(
      scoreZone({
        id: "loose",
        name: home ? "Plants off a bed" : "Stems off a plot",
        trees: loose,
        notes: input.observations.filter((row) => !row.plotId && (row.domain === "plant_health" || row.domain === "harvest")),
        home,
      }),
    );
  }

  const rank: Record<ZoneBand, number> = { thin: 0, mixed: 1, strong: 2, empty: 3 };
  return zones.sort((a, b) => rank[a.band] - rank[b.band] || a.name.localeCompare(b.name));
}

function scoreZone(input: {
  id: string;
  name: string;
  trees: TreeRow[];
  notes: ObservationRow[];
  home: boolean;
}): FieldZone {
  const healthNotes = input.notes.filter((row) => row.domain === "plant_health");
  const harvests = input.notes.filter((row) => row.domain === "harvest");
  const stemScores = input.trees.map((tree) => HEALTH_SCORE[tree.health] ?? 0.5);
  let score: number | null = stemScores.length
    ? Math.round((stemScores.reduce((sum, n) => sum + n, 0) / stemScores.length) * 100)
    : healthNotes.length || harvests.length
      ? 60
      : null;

  if (score != null) {
    for (const note of healthNotes) {
      const health = note.details?.aiSuggestion?.health;
      if (health === "stressed" || health === "dead") score -= 18;
      else if (health === "watch") score -= 8;
      else if (health === "healthy") score += 4;
    }
    if (harvests.length) score += 5;
    score = Math.max(0, Math.min(100, score));
  }

  const band: ZoneBand = score == null ? "empty" : score >= 75 ? "strong" : score >= 45 ? "mixed" : "thin";
  const kg = sumKg(harvests);
  const bits = [
    input.trees.length ? `${input.trees.length} stems` : null,
    healthNotes.length ? `${healthNotes.length} crop notes` : null,
    kg > 0 ? `${trimNum(kg)} kg picked` : null,
  ].filter(Boolean);

  return {
    id: input.id,
    name: input.name,
    band,
    score,
    detail: bits.join(" · ") || "No stems or notes on this patch yet",
    action: zoneAction(band, input.home),
  };
}

function zoneAction(band: ZoneBand, home: boolean) {
  if (home) {
    if (band === "strong") return "These pots are holding. Water when the top of the mix is dry.";
    if (band === "mixed") return "Check the saucer. A wet pot and a dry pot need different water.";
    if (band === "thin") return "Shift the pot off harsh afternoon sun and pick off the worst leaves.";
    return "Name the pot or bed, then save one photo so this patch can be scored.";
  }
  if (band === "strong") return "Keep this patch on the same water and feed as last week.";
  if (band === "mixed") return "Walk it. One rate across the whole field will miss the weak plants.";
  if (band === "thin") return "Mulch and scout. Ease a heavy feed until this patch steadies.";
  return "Log a photo or a pick here so the zone can be scored.";
}

function cropOutlook(
  input: { scale: GuideScale; stands: PlantStandRow[]; observations: ObservationRow[] },
  today: WeatherDay | null,
  tomorrow: WeatherDay | null,
): CropOutlook[] {
  const harvests = input.observations.filter((row) => row.domain === "harvest");
  const byCrop = new Map<string, { stage: string | null; planted: Date | null; rows: ObservationRow[] }>();

  for (const stand of input.stands) {
    const crop = stand.crop.trim() || stand.name;
    const prev = byCrop.get(crop) ?? { stage: null, planted: null, rows: [] };
    prev.stage = stand.stage || prev.stage;
    if (stand.plantedOn && (!prev.planted || stand.plantedOn < prev.planted)) prev.planted = stand.plantedOn;
    byCrop.set(crop, prev);
  }
  for (const row of harvests) {
    const crop = row.details?.crop?.trim() || "Harvest";
    const prev = byCrop.get(crop) ?? { stage: null, planted: null, rows: [] };
    prev.rows.push(row);
    byCrop.set(crop, prev);
  }

  const wet = (today?.rainMm ?? 0) + (tomorrow?.rainMm ?? 0) >= 8;
  const hot = (today?.maxC ?? 0) >= 34;
  const home = input.scale === "home";

  const rows = [...byCrop.entries()].map(([crop, info]) => {
    const kg = sumKg(info.rows);
    const harvested = kg > 0 ? `${trimNum(kg)} kg in 90 days` : null;
    const days = info.planted ? Math.max(0, Math.round((Date.now() - info.planted.getTime()) / 86_400_000)) : null;
    const stageBit = info.stage ? `${info.stage}${days != null ? `, planted ${days} days ago` : ""}` : null;
    let line = stageBit ? `${crop}: ${stageBit}.` : `${crop}.`;
    if (harvested) line += ` ${harvested}.`;
    if (info.stage === "flowering" || info.stage === "harvest") {
      line += wet
        ? " A wet day is close — pick ripe fruit and look under the leaves."
        : home
          ? " Pick little and often so the pot keeps flowering."
          : " Pick on the usual round.";
    } else if (info.stage === "seedling" && hot) {
      line += home ? " Shade the pot through the afternoon." : " Shade seedlings if the afternoon is harsh.";
    } else if (!info.stage && !harvested) {
      line += " Log a stage or a pick to start an outlook.";
    }
    return { crop, stage: info.stage, harvested, line };
  });

  if (!rows.length) {
    return [
      {
        crop: home ? "Kitchen beds" : "Crops",
        stage: null,
        harvested: null,
        line: home
          ? "Name each pot or bed, then log a pick. A handful counts."
          : "Add a bed and log a pick. Yield starts from those two notes.",
      },
    ];
  }

  return rows.sort((a, b) => (b.harvested ? 1 : 0) - (a.harvested ? 1 : 0) || a.crop.localeCompare(b.crop));
}

function waterCalls(
  input: { scale: GuideScale; devices: DeviceRow[]; readings: ReadingRow[] },
  today: WeatherDay | null,
  tomorrow: WeatherDay | null,
): WaterCall[] {
  const calls: WaterCall[] = [];
  const tomorrowRain = tomorrow?.rainMm ?? 0;
  const todayRain = today?.rainMm ?? 0;
  const hot = (today?.maxC ?? 0) >= 34;
  const rainComing = tomorrowRain >= 8 || todayRain >= 8;

  if (rainComing) {
    calls.push({
      title: "Rain is on the land",
      detail:
        input.scale === "home"
          ? `${trimNum(Math.max(todayRain, tomorrowRain))} mm is due. Open beds can wait. Covered pots still need a finger-check.`
          : `${trimNum(Math.max(todayRain, tomorrowRain))} mm is due. Hold irrigation unless a bed is still dusty.`,
      tone: "wait",
    });
  }

  for (const device of input.devices) {
    if (device.kind !== "soil" && device.kind !== "pond" && device.kind !== "tank") continue;
    const reading = input.readings.find((row) => row.deviceId === device.id && moistureMetric(row.metric, device.kind));
    if (device.status === "stale" || device.status === "offline" || device.status === "error") {
      calls.push({
        title: device.name,
        detail: "This probe is quiet. Water from the forecast until it speaks again.",
        tone: "check",
      });
      continue;
    }
    if (!reading) {
      calls.push({
        title: device.name,
        detail: "No moisture reading yet. Pair a value, or decide by the rain line.",
        tone: "check",
      });
      continue;
    }
    if (device.kind === "soil") {
      const pct = asPercent(reading.value, reading.unit);
      if (pct < 30 && !rainComing) {
        calls.push({
          title: device.name,
          detail: `Soil is about ${Math.round(pct)}%. Water in the morning, at the soil.`,
          tone: "water",
        });
      } else if (pct > 65 || rainComing) {
        calls.push({
          title: device.name,
          detail: `Soil is about ${Math.round(pct)}%. Leave the pump off.`,
          tone: "wait",
        });
      } else {
        calls.push({
          title: device.name,
          detail: `Soil is about ${Math.round(pct)}%. Check again this evening.`,
          tone: "check",
        });
      }
    } else {
      calls.push({
        title: device.name,
        detail: `Last reading ${trimNum(reading.value)}${reading.unit ? ` ${reading.unit}` : ""}.`,
        tone: "check",
      });
    }
  }

  if (!input.devices.some((device) => device.kind === "soil")) {
    if (!rainComing && hot) {
      calls.push({
        title: input.scale === "home" ? "Pots" : "Beds",
        detail:
          input.scale === "home"
            ? "A hot day dries a pot by evening. Check morning and again before dusk."
            : "Hot and dry. Water early, then log the minutes.",
        tone: "water",
      });
    } else if (!rainComing) {
      calls.push({
        title: input.scale === "home" ? "Pots" : "Beds",
        detail: "No soil probe yet. Press a finger into the mix before you water.",
        tone: "check",
      });
    }
  }

  return calls.slice(0, 6);
}

function buildAdvisories(input: {
  scale: GuideScale;
  weather: FarmWeather | null;
  today: WeatherDay | null;
  tomorrow: WeatherDay | null;
  observations: ObservationRow[];
  zones: FieldZone[];
  water: WaterCall[];
  now: Date;
}) {
  const lines: string[] = [];
  const rainToday = todayRainMm(input.weather);
  if (rainToday != null) {
    lines.push(
      rainToday >= 1
        ? `${trimNum(rainToday)} mm of rain is on today. Skip a spray on wet leaves.`
        : "Today is dry. Morning is the safer time to water or to spray a leaf wash.",
    );
  }
  for (const hold of phiHolds(input.observations, input.now)) {
    lines.push(`${hold.crop}: ${phiLabel(hold.until, input.now)}.`);
  }
  const humid = (input.weather?.humidity ?? 0) >= 85 && (input.today?.maxC ?? 0) >= 28;
  if (humid) {
    lines.push(
      input.scale === "home"
        ? "Warm and humid. Space the pots so leaves dry, and look under them."
        : "Warm and humid. Scout beds for leaf spots before the next wet night.",
    );
  }
  const thin = input.zones.find((zone) => zone.band === "thin");
  if (thin) lines.push(`${thin.name} is the thin patch. ${thin.action}`);
  const water = input.water.find((call) => call.tone === "water") ?? input.water[0];
  if (water) lines.push(`${water.title}. ${water.detail}`);
  if (input.scale === "home") {
    lines.push("Kitchen herbs want small, frequent water. Field-sized doses will drown a pot.");
  }
  return lines.slice(0, 6);
}

function recentIssues(rows: ObservationRow[], now: Date): RecentIssue[] {
  const cutoff = now.getTime() - 45 * 86_400_000;
  return rows
    .filter((row) => row.domain === "plant_health" && row.occurredAt.getTime() >= cutoff)
    .slice(0, 4)
    .map((row) => {
      const ai = row.details?.aiSuggestion;
      return {
        id: row.id,
        crop: row.details?.crop || ai?.species || "Crop",
        issue: ai?.issue || row.note || "Logged, with no named issue",
        cause: ai?.cause && ai.cause !== "unknown" ? ai.cause : null,
        step: ai?.culturalControl ?? null,
        when: row.occurredAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      };
    });
}

function recentPicks(rows: ObservationRow[], now: Date): MarketPick[] {
  const cutoff = now.getTime() - 21 * 86_400_000;
  return rows
    .filter((row) => row.domain === "harvest" && row.occurredAt.getTime() >= cutoff)
    .slice(0, 5)
    .map((row) => ({
      crop: row.details?.crop || "Pick",
      qty: row.details?.quantity != null ? `${trimNum(row.details.quantity)}${row.details.unit ? ` ${row.details.unit}` : ""}` : "logged",
      destination: row.details?.destination ?? null,
    }));
}

function marketAdvice(picks: MarketPick[], tomorrow: WeatherDay | null, scale: GuideScale) {
  const wet = (tomorrow?.rainMm ?? 0) >= 8;
  const tender = picks.some((pick) => TENDER.some((word) => pick.crop.toLowerCase().includes(word)));
  if (wet && (tender || scale === "home")) {
    return "A wet day is close. Move leafy picks and soft herbs today. Fruit can wait a day. Live mandi rates stay on Agmarknet.";
  }
  if (picks[0]) {
    const where = picks[0].destination ? ` → ${picks[0].destination}` : "";
    return `Latest pick: ${picks[0].crop} ${picks[0].qty}${where}. Live mandi rates stay on Agmarknet.`;
  }
  return scale === "home"
    ? "A home pick is often the kitchen. Log the handful anyway so the season has a yield. Live mandi rates stay on Agmarknet."
    : "Log where the pick went. Live mandi rates stay on Agmarknet.";
}

function plotIdForPoint(lng: number, lat: number, plots: PlotRow[]) {
  for (const plot of plots) {
    const ring = plot.polygon?.coordinates?.[0];
    if (ring && pointInRing(lng, lat, ring)) return plot.id;
  }
  return null;
}

function pointInRing(lng: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0];
    const yi = ring[i]?.[1];
    const xj = ring[j]?.[0];
    const yj = ring[j]?.[1];
    if (xi == null || yi == null || xj == null || yj == null) continue;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function moistureMetric(metric: string, kind: DeviceRow["kind"]) {
  const name = metric.toLowerCase();
  if (kind === "soil") return name.includes("moist") || name.includes("vwc") || name.includes("soil") || name === "humidity";
  return name.includes("level") || name.includes("depth") || name.includes("cm") || name.includes("moist") || name === "value";
}

function asPercent(value: number, unit: string | null) {
  if (unit?.includes("%")) return value;
  if (value <= 1.5) return value * 100;
  return value;
}

function sumKg(rows: ObservationRow[]) {
  return rows.reduce((sum, row) => {
    const qty = row.details?.quantity;
    if (qty == null || !Number.isFinite(qty)) return sum;
    const unit = (row.details?.unit || "kg").toLowerCase();
    if (unit === "kg" || unit === "kilogram" || unit === "kilograms") return sum + qty;
    return sum;
  }, 0);
}

function dayOn(weather: FarmWeather | null, todayDate: string, offset: number) {
  if (!weather) return null;
  const target = addDays(todayDate, offset);
  return weather.week.find((day) => day.date === target) ?? null;
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function calendarDate(at: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

function trimNum(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
