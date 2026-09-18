import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DeviceRow,
  GeoPolygon,
  ObservationRow,
  ReadingRow,
  SpeciesRow,
  TreeRow,
  ZoneRow,
} from "@/db/schema";
import { seedSpecies, zoneLabels } from "@/lib/farm";

type FarmFile = {
  species: SpeciesRow[];
  zones: ZoneRow[];
  trees: TreeRow[];
  observations: ObservationRow[];
  devices: DeviceRow[];
  readings: ReadingRow[];
};

const filePath = path.join(process.cwd(), ".data", "farm.json");

let cache: FarmFile | null = null;
let chain: Promise<unknown> = Promise.resolve();

function revive(data: Partial<FarmFile>): FarmFile {
  return {
    species: (data.species ?? []).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    zones: (data.zones ?? []).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    trees: (data.trees ?? []).map((row) => ({
      ...row,
      plantedOn: row.plantedOn ? new Date(row.plantedOn) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    observations: (data.observations ?? []).map((row) => ({
      ...row,
      occurredAt: new Date(row.occurredAt),
      createdAt: new Date(row.createdAt),
    })),
    devices: (data.devices ?? []).map((row) => ({
      ...row,
      lastSeenAt: row.lastSeenAt ? new Date(row.lastSeenAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    readings: (data.readings ?? []).map((row) => ({
      ...row,
      occurredAt: new Date(row.occurredAt),
      createdAt: new Date(row.createdAt),
    })),
  };
}

function seed(): FarmFile {
  const now = new Date();
  return {
    species: seedSpecies.map((row) => ({
      id: crypto.randomUUID(),
      name: row.name,
      tamil: row.tamil,
      category: row.category,
      createdAt: now,
    })),
    zones: [
      ...zoneLabels.map((name) => ({
        id: crypto.randomUUID(),
        name,
        polygon: null,
        createdAt: now,
      })),
      { id: crypto.randomUUID(), name: "Farm boundary", polygon: null, createdAt: now },
    ],
    trees: [],
    observations: [],
    devices: [],
    readings: [],
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
  async listObservations(opts: { domain?: string; treeId?: string; limit?: number }) {
    const data = await read();
    let rows = data.observations;
    if (opts.treeId) rows = rows.filter((row) => row.treeId === opts.treeId);
    if (opts.domain) rows = rows.filter((row) => row.domain === opts.domain);
    return [...rows]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, opts.limit ?? 80);
  },
  insertDevice(row: DeviceRow) {
    return mutate((data) => {
      data.devices.unshift(row);
      return row;
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
  async getDeviceByToken(token: string) {
    const data = await read();
    return data.devices.find((row) => row.token === token) ?? null;
  },
  updateDevice(id: string, patch: Partial<DeviceRow>) {
    return mutate((data) => {
      const row = data.devices.find((device) => device.id === id);
      if (!row) return;
      Object.assign(row, patch);
    });
  },
  deleteDevice(id: string) {
    return mutate((data) => {
      data.devices = data.devices.filter((row) => row.id !== id);
      data.readings = data.readings.filter((row) => row.deviceId !== id);
    });
  },
  insertReading(row: ReadingRow) {
    return mutate((data) => {
      data.readings.unshift(row);
      if (data.readings.length > 1500) data.readings.length = 1500;
      return row;
    });
  },
  async listReadings(opts: { deviceId?: string; limit?: number }) {
    const data = await read();
    let rows = data.readings;
    if (opts.deviceId) rows = rows.filter((row) => row.deviceId === opts.deviceId);
    return [...rows]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, opts.limit ?? 40);
  },
  async dashboardStats() {
    const data = await read();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekByDomain: Record<string, number> = {};
    const lastByDomain: Record<string, Date | null> = {};
    for (const row of data.observations) {
      const last = lastByDomain[row.domain];
      if (!last || row.occurredAt > last) lastByDomain[row.domain] = row.occurredAt;
      if (row.occurredAt.getTime() >= weekAgo) {
        weekByDomain[row.domain] = (weekByDomain[row.domain] ?? 0) + 1;
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
    };
  },
};
