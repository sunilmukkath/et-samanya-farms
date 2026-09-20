import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  BookAccountRow,
  BookLineRow,
  BookPartyRow,
  BookSettingsRow,
  BookVoucherRow,
  DeviceRow,
  GeoPolygon,
  ObservationRow,
  ReadingRow,
  SpeciesRow,
  TreeRow,
  ZoneRow,
} from "@/db/schema";
import { chartOfAccounts } from "@/lib/accounts";
import { newDeviceToken } from "@/lib/equipment";
import { seedSpecies, zoneLabels } from "@/lib/farm";

type FarmFile = {
  species: SpeciesRow[];
  zones: ZoneRow[];
  trees: TreeRow[];
  observations: ObservationRow[];
  devices: DeviceRow[];
  readings: ReadingRow[];
  bookAccounts: BookAccountRow[];
  bookParties: BookPartyRow[];
  bookVouchers: BookVoucherRow[];
  bookLines: BookLineRow[];
  bookSettings: BookSettingsRow | null;
};

const filePath = path.join(process.cwd(), ".data", "farm.json");

type StoreState = {
  cache: FarmFile | null;
  chain: Promise<unknown>;
  loading: Promise<FarmFile> | null;
  mtimeMs: number;
};

const g = globalThis as typeof globalThis & { __etSamanyaFarmStore?: StoreState };
if (!g.__etSamanyaFarmStore) {
  g.__etSamanyaFarmStore = { cache: null, chain: Promise.resolve(), loading: null, mtimeMs: 0 };
}
const store = g.__etSamanyaFarmStore;

async function stamp() {
  store.mtimeMs = (await stat(filePath)).mtimeMs;
}

async function loadFromDisk(): Promise<FarmFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<FarmFile>;
    store.cache = revive(parsed);
    if (!parsed.bookAccounts?.length || !parsed.bookSettings) {
      await persist(store.cache);
    } else {
      await stamp();
    }
    return store.cache;
  } catch {
    store.cache = seed();
    await persist(store.cache);
    return store.cache;
  }
}

function seedAccounts(now: Date): BookAccountRow[] {
  return chartOfAccounts.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    tamil: row.tamil,
    type: row.type,
    groupName: row.group,
    createdAt: now,
  }));
}

function seedSettings(now: Date): BookSettingsRow {
  return {
    id: "farm",
    gstin: null,
    pan: null,
    smsToken: newDeviceToken(),
    createdAt: now,
    updatedAt: now,
  };
}

function revive(data: Partial<FarmFile>): FarmFile {
  const now = new Date();
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
    bookAccounts: data.bookAccounts?.length ? data.bookAccounts.map((row) => ({ ...row, createdAt: new Date(row.createdAt) })) : seedAccounts(now),
    bookParties: (data.bookParties ?? []).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    bookVouchers: (data.bookVouchers ?? []).map((row) => ({
      ...row,
      occurredAt: new Date(row.occurredAt),
      createdAt: new Date(row.createdAt),
    })),
    bookLines: (data.bookLines ?? []).map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    bookSettings: data.bookSettings
      ? {
          ...data.bookSettings,
          createdAt: new Date(data.bookSettings.createdAt),
          updatedAt: new Date(data.bookSettings.updatedAt),
        }
      : seedSettings(now),
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
    bookAccounts: seedAccounts(now),
    bookParties: [],
    bookVouchers: [],
    bookLines: [],
    bookSettings: seedSettings(now),
  };
}

async function read(): Promise<FarmFile> {
  try {
    const info = await stat(filePath);
    if (store.cache && info.mtimeMs === store.mtimeMs) return store.cache;
    store.cache = null;
    store.loading = null;
  } catch {
    store.cache = null;
    store.loading = null;
  }
  store.loading ??= loadFromDisk();
  return store.loading;
}

async function persist(data: FarmFile) {
  store.cache = data;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data));
  await stamp();
}

function mutate<T>(fn: (data: FarmFile) => T | Promise<T>) {
  const run = store.chain.then(async () => {
    const data = await read();
    const result = await fn(data);
    await persist(data);
    return result;
  });
  store.chain = run.then(
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
  async listBookAccounts() {
    const data = await read();
    return [...data.bookAccounts].sort((a, b) => a.code.localeCompare(b.code));
  },
  async getBookSettings() {
    const data = await read();
    return data.bookSettings;
  },
  saveBookSettings(patch: Partial<BookSettingsRow>) {
    return mutate((data) => {
      const now = new Date();
      data.bookSettings = {
        ...(data.bookSettings ?? seedSettings(now)),
        ...patch,
        updatedAt: now,
      };
      return data.bookSettings;
    });
  },
  async listParties() {
    const data = await read();
    return [...data.bookParties].sort((a, b) => a.name.localeCompare(b.name));
  },
  upsertParty(row: BookPartyRow) {
    return mutate((data) => {
      const existing = data.bookParties.find((item) => item.name.toLowerCase() === row.name.toLowerCase());
      if (existing) {
        Object.assign(existing, { gstin: row.gstin ?? existing.gstin, phone: row.phone ?? existing.phone, upi: row.upi ?? existing.upi });
        return existing;
      }
      data.bookParties.unshift(row);
      return row;
    });
  },
  insertVoucher(voucher: BookVoucherRow, lines: BookLineRow[]) {
    return mutate((data) => {
      data.bookVouchers.unshift(voucher);
      data.bookLines.unshift(...lines);
      return voucher;
    });
  },
  async getVoucher(id: string) {
    const data = await read();
    return data.bookVouchers.find((row) => row.id === id) ?? null;
  },
  async getVoucherBySmsHash(hash: string) {
    const data = await read();
    return data.bookVouchers.find((row) => row.smsHash === hash) ?? null;
  },
  async listVouchers(opts: { fy?: string; kind?: string; limit?: number }) {
    const data = await read();
    let rows = data.bookVouchers;
    if (opts.fy) rows = rows.filter((row) => row.fy === opts.fy);
    if (opts.kind) rows = rows.filter((row) => row.kind === opts.kind);
    return [...rows]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, opts.limit ?? 80);
  },
  async listLines(opts: { voucherId?: string; accountId?: string; limit?: number }) {
    const data = await read();
    let rows = data.bookLines;
    if (opts.voucherId) rows = rows.filter((row) => row.voucherId === opts.voucherId);
    if (opts.accountId) rows = rows.filter((row) => row.accountId === opts.accountId);
    return [...rows]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, opts.limit ?? 200);
  },
  deleteVoucher(id: string) {
    return mutate((data) => {
      data.bookVouchers = data.bookVouchers.filter((row) => row.id !== id);
      data.bookLines = data.bookLines.filter((row) => row.voucherId !== id);
    });
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
