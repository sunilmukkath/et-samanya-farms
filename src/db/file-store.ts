import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AlertRow,
  AnimalRow,
  BriefRow,
  DeviceRow,
  FarmProfileRow,
  FirmwareRow,
  GeoPolygon,
  LedgerRow,
  ObservationRow,
  PlantStandRow,
  PlotRow,
  ReadingRow,
  SpeciesRow,
  TaskRow,
  TreeRow,
  ZoneRow,
} from "@/db/schema";
import type { FarmProfile } from "@/lib/packs/types";
import { samanyaProfile } from "@/lib/profiles/samanya";

type FarmFile = {
  species: SpeciesRow[];
  zones: ZoneRow[];
  trees: TreeRow[];
  observations: ObservationRow[];
  plots: PlotRow[];
  animals: AnimalRow[];
  tasks: TaskRow[];
  briefs: BriefRow[];
  ledger: LedgerRow[];
  profile: FarmProfileRow | null;
  plantStands: PlantStandRow[];
  devices: DeviceRow[];
  readings: ReadingRow[];
  alerts: AlertRow[];
  firmware: FirmwareRow[];
};

const filePath = path.join(process.cwd(), ".data", "farm.json");

let cache: FarmFile | null = null;
let chain: Promise<unknown> = Promise.resolve();

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revive(data: Partial<FarmFile>): FarmFile {
  const base = seed();
  return {
    species: (data.species ?? base.species).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    zones: (data.zones ?? base.zones).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    trees: (data.trees ?? []).map((row) => ({
      ...row,
      plantedOn: asDate(row.plantedOn),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    observations: (data.observations ?? []).map((row) => ({
      ...row,
      plotId: row.plotId ?? null,
      animalId: row.animalId ?? null,
      plantStandId: row.plantStandId ?? null,
      source: row.source ?? null,
      createdBy: row.createdBy ?? null,
      occurredAt: new Date(row.occurredAt),
      createdAt: new Date(row.createdAt),
    })),
    plots: (data.plots ?? base.plots).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    animals: (data.animals ?? []).map((row) => ({
      ...row,
      bornOn: asDate(row.bornOn),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    tasks: (data.tasks ?? []).map((row) => ({
      ...row,
      dueAt: asDate(row.dueAt),
      completedAt: asDate(row.completedAt),
      createdAt: new Date(row.createdAt),
    })),
    briefs: (data.briefs ?? []).map((row) => ({
      ...row,
      periodStart: new Date(row.periodStart),
      periodEnd: new Date(row.periodEnd),
      createdAt: new Date(row.createdAt),
    })),
    ledger: (data.ledger ?? []).map((row) => ({
      ...row,
      occurredAt: new Date(row.occurredAt),
      createdAt: new Date(row.createdAt),
    })),
    profile: data.profile
      ? { ...data.profile, updatedAt: new Date(data.profile.updatedAt) }
      : base.profile,
    plantStands: (data.plantStands ?? []).map((row) => ({
      ...row,
      plantedOn: asDate(row.plantedOn),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    devices: (data.devices ?? []).map((row) => ({
      ...row,
      lastSeenAt: asDate(row.lastSeenAt),
      createdAt: new Date(row.createdAt),
    })),
    readings: (data.readings ?? []).map((row) => ({
      ...row,
      recordedAt: new Date(row.recordedAt),
    })),
    alerts: (data.alerts ?? []).map((row) => ({
      ...row,
      acknowledgedAt: asDate(row.acknowledgedAt),
      createdAt: new Date(row.createdAt),
    })),
    firmware: (data.firmware ?? []).map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
    })),
  };
}

function seed(): FarmFile {
  const now = new Date();
  return {
    species: samanyaProfile.seedSpecies.map((row) => ({
      id: crypto.randomUUID(),
      name: row.name,
      tamil: row.tamil,
      category: row.category,
      createdAt: now,
    })),
    zones: [
      ...samanyaProfile.zoneLabels.map((name) => ({
        id: crypto.randomUUID(),
        name,
        polygon: null,
        createdAt: now,
      })),
      { id: crypto.randomUUID(), name: "Farm boundary", polygon: null, createdAt: now },
    ],
    trees: [],
    observations: [],
    plots: samanyaProfile.seedPlots.map((plot) => ({
      id: crypto.randomUUID(),
      name: plot.name,
      kind: plot.kind,
      polygon: null,
      note: null,
      createdAt: now,
    })),
    animals: [],
    tasks: [],
    briefs: [],
    ledger: [],
    profile: {
      id: "farm",
      config: samanyaProfile as unknown as Record<string, unknown>,
      updatedAt: now,
    },
    plantStands: [],
    devices: [],
    readings: [],
    alerts: [],
    firmware: [],
  };
}

async function read(): Promise<FarmFile> {
  if (cache) return cache;
  try {
    const raw = await readFile(filePath, "utf8");
    cache = revive(JSON.parse(raw) as Partial<FarmFile>);
    return cache;
  } catch {
    cache = seed();
    await persist(cache);
    return cache;
  }
}

async function persist(data: FarmFile) {
  cache = data;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data));
}

function mutate<T>(fn: (data: FarmFile) => T | Promise<T>) {
  const run = chain.then(async () => {
    const data = await read();
    const result = await fn(data);
    await persist(data);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const fileStore = {
  async listSpecies() {
    const data = await read();
    return [...data.species].sort((a, b) => a.name.localeCompare(b.name));
  },
  upsertSpecies(name: string, tamil?: string | null) {
    const trimmed = name.trim();
    if (!trimmed) return Promise.resolve(undefined);
    return mutate((data) => {
      const existing = data.species.find((row) => row.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;
      const row: SpeciesRow = {
        id: crypto.randomUUID(),
        name: trimmed,
        tamil: tamil ?? null,
        category: "custom",
        createdAt: new Date(),
      };
      data.species.push(row);
      return row;
    });
  },
  async listZones() {
    const data = await read();
    return [...data.zones].sort((a, b) => a.name.localeCompare(b.name));
  },
  saveFarmBoundary(polygon: GeoPolygon | null) {
    return mutate((data) => {
      const existing = data.zones.find((row) => row.name === "Farm boundary");
      if (existing) {
        existing.polygon = polygon;
        return;
      }
      data.zones.push({
        id: crypto.randomUUID(),
        name: "Farm boundary",
        polygon,
        createdAt: new Date(),
      });
    });
  },
  async listTrees() {
    const data = await read();
    return [...data.trees].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  async getTree(id: string) {
    const data = await read();
    return data.trees.find((row) => row.id === id) ?? null;
  },
  insertTree(row: TreeRow) {
    return mutate((data) => {
      data.trees.unshift(row);
      return row;
    });
  },
  updateTree(id: string, patch: Partial<TreeRow>) {
    return mutate((data) => {
      const row = data.trees.find((tree) => tree.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  insertObservation(row: ObservationRow) {
    return mutate((data) => {
      data.observations.unshift(row);
      return row;
    });
  },
  async listObservations(opts: {
    domain?: string;
    treeId?: string;
    plotId?: string;
    animalId?: string;
    plantStandId?: string;
    query?: string;
    since?: Date;
    limit?: number;
  }) {
    const data = await read();
    let rows = data.observations;
    if (opts.treeId) rows = rows.filter((row) => row.treeId === opts.treeId);
    if (opts.plotId) rows = rows.filter((row) => row.plotId === opts.plotId);
    if (opts.animalId) rows = rows.filter((row) => row.animalId === opts.animalId);
    if (opts.plantStandId) rows = rows.filter((row) => row.plantStandId === opts.plantStandId);
    if (opts.domain) rows = rows.filter((row) => row.domain === opts.domain);
    if (opts.since) rows = rows.filter((row) => row.occurredAt >= opts.since!);
    if (opts.query) {
      const q = opts.query.toLowerCase();
      rows = rows.filter((row) => {
        const hay = `${row.note ?? ""} ${JSON.stringify(row.details ?? {})}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return [...rows]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, opts.limit ?? 80);
  },
  async dashboardStats() {
    const data = await read();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekByDomain: Record<string, number> = {};
    const lastByDomain: Record<string, Date | null> = {};
    let harvestKg = 0;
    let rainMmLogged = 0;
    for (const row of data.observations) {
      const last = lastByDomain[row.domain];
      if (!last || row.occurredAt > last) lastByDomain[row.domain] = row.occurredAt;
      if (row.occurredAt.getTime() >= weekAgo) {
        weekByDomain[row.domain] = (weekByDomain[row.domain] ?? 0) + 1;
        if (row.domain === "harvest" && row.details?.quantity) harvestKg += Number(row.details.quantity);
        if (row.domain === "rain" && row.details?.rainMm) rainMmLogged += Number(row.details.rainMm);
      }
    }
    const healthCounts: Record<string, number> = {};
    const speciesMap: Record<string, number> = {};
    for (const tree of data.trees) {
      healthCounts[tree.health] = (healthCounts[tree.health] ?? 0) + 1;
      speciesMap[tree.species] = (speciesMap[tree.species] ?? 0) + 1;
    }
    return {
      treeCount: data.trees.length,
      weekByDomain,
      lastByDomain,
      healthCounts,
      speciesCounts: Object.entries(speciesMap)
        .map(([species, count]) => ({ species, count }))
        .sort((a, b) => b.count - a.count),
      harvestKgWeek: harvestKg,
      rainMmWeek: rainMmLogged,
      openTasks: data.tasks.filter((task) => !task.completedAt).length,
    };
  },
  async listPlots() {
    const data = await read();
    return [...data.plots].sort((a, b) => a.name.localeCompare(b.name));
  },
  insertPlot(row: PlotRow) {
    return mutate((data) => {
      data.plots.push(row);
      return row;
    });
  },
  updatePlot(id: string, patch: Partial<PlotRow>) {
    return mutate((data) => {
      const row = data.plots.find((plot) => plot.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  async listAnimals() {
    const data = await read();
    return [...data.animals].sort((a, b) => a.name.localeCompare(b.name));
  },
  insertAnimal(row: AnimalRow) {
    return mutate((data) => {
      data.animals.push(row);
      return row;
    });
  },
  updateAnimal(id: string, patch: Partial<AnimalRow>) {
    return mutate((data) => {
      const row = data.animals.find((animal) => animal.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  async listTasks(includeDone = false) {
    const data = await read();
    return data.tasks
      .filter((task) => includeDone || !task.completedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  insertTask(row: TaskRow) {
    return mutate((data) => {
      const exists = data.tasks.some(
        (task) => !task.completedAt && task.title === row.title && task.treeId === row.treeId,
      );
      if (exists) return row;
      data.tasks.unshift(row);
      return row;
    });
  },
  completeTask(id: string, observationId: string | null) {
    return mutate((data) => {
      const row = data.tasks.find((task) => task.id === id);
      if (!row) return;
      row.completedAt = new Date();
      row.completedObservationId = observationId;
    });
  },
  async latestBrief(kind?: string) {
    const data = await read();
    const rows = kind ? data.briefs.filter((row) => row.kind === kind) : data.briefs;
    return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  },
  insertBrief(row: BriefRow) {
    return mutate((data) => {
      data.briefs.unshift(row);
      return row;
    });
  },
  async listLedger(limit = 80) {
    const data = await read();
    return [...data.ledger]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
  },
  insertLedger(row: LedgerRow) {
    return mutate((data) => {
      data.ledger.unshift(row);
      return row;
    });
  },
  async getFarmProfileRecord(): Promise<FarmProfile | null> {
    const data = await read();
    return (data.profile?.config as FarmProfile | undefined) ?? null;
  },
  saveFarmProfileRecord(profile: FarmProfile) {
    return mutate((data) => {
      data.profile = { id: "farm", config: profile as unknown as Record<string, unknown>, updatedAt: new Date() };
      return profile;
    });
  },
  async listPlantStands() {
    const data = await read();
    return [...data.plantStands].sort((a, b) => a.name.localeCompare(b.name));
  },
  insertPlantStand(row: PlantStandRow) {
    return mutate((data) => {
      data.plantStands.push(row);
      return row;
    });
  },
  updatePlantStand(id: string, patch: Partial<PlantStandRow>) {
    return mutate((data) => {
      const row = data.plantStands.find((stand) => stand.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  async listDevices() {
    const data = await read();
    return [...data.devices].sort((a, b) => a.name.localeCompare(b.name));
  },
  async getDevice(id: string) {
    const data = await read();
    return data.devices.find((row) => row.id === id) ?? null;
  },
  async getDeviceByTokenHash(tokenHash: string) {
    const data = await read();
    return data.devices.find((row) => row.tokenHash === tokenHash) ?? null;
  },
  insertDevice(row: DeviceRow) {
    return mutate((data) => {
      data.devices.push(row);
      return row;
    });
  },
  updateDevice(id: string, patch: Partial<DeviceRow>) {
    return mutate((data) => {
      const row = data.devices.find((device) => device.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  insertReading(row: ReadingRow) {
    return mutate((data) => {
      data.readings.push(row);
      return row;
    });
  },
  async listReadings(opts: { deviceId?: string; metric?: string; since?: Date; limit?: number } = {}) {
    const data = await read();
    let rows = data.readings;
    if (opts.deviceId) rows = rows.filter((row) => row.deviceId === opts.deviceId);
    if (opts.metric) rows = rows.filter((row) => row.metric === opts.metric);
    if (opts.since) rows = rows.filter((row) => row.recordedAt >= opts.since!);
    return [...rows]
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, opts.limit ?? 200);
  },
  async latestReadings() {
    const data = await read();
    const map = new Map<string, ReadingRow>();
    for (const row of [...data.readings].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())) {
      map.set(`${row.deviceId}:${row.metric}`, row);
    }
    return [...map.values()];
  },
  async listAlerts(includeAck = false) {
    const data = await read();
    return data.alerts
      .filter((row) => includeAck || !row.acknowledgedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  insertAlert(row: AlertRow) {
    return mutate((data) => {
      const exists = data.alerts.some(
        (alert) => !alert.acknowledgedAt && alert.title === row.title && alert.deviceId === row.deviceId,
      );
      if (exists) return row;
      data.alerts.unshift(row);
      return row;
    });
  },
  acknowledgeAlert(id: string) {
    return mutate((data) => {
      const row = data.alerts.find((alert) => alert.id === id);
      if (!row) return;
      row.acknowledgedAt = new Date();
    });
  },
  async listFirmware() {
    const data = await read();
    return [...data.firmware].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  insertFirmware(row: FirmwareRow) {
    return mutate((data) => {
      data.firmware.unshift(row);
      return row;
    });
  },
};
