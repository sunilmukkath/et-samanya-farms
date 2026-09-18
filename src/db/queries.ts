import { desc, eq, gte, sql } from "drizzle-orm";
import { fileStore } from "@/db/file-store";
import { ensureSchema, getDb, isDatabaseConfigured } from "@/db/index";
import {
  deviceReadings,
  farmDevices,
  farmZones,
  observations,
  speciesCatalog,
  trees,
  type DeviceRow,
  type GeoPolygon,
  type ObservationDomain,
  type ObservationRow,
  type ReadingRow,
  type SpeciesRow,
  type TreeHealth,
  type TreeRow,
  type ZoneRow,
} from "@/db/schema";
import { nearestPoints } from "@/lib/geo";

export { isDatabaseConfigured };

function usingFileStore() {
  return !isDatabaseConfigured() && process.env.VERCEL !== "1";
}

export function canPersistFarmData() {
  return isDatabaseConfigured() || process.env.VERCEL !== "1";
}

async function db() {
  await ensureSchema();
  return getDb();
}

export async function listSpecies(): Promise<SpeciesRow[]> {
  if (usingFileStore()) return fileStore.listSpecies();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(speciesCatalog).orderBy(speciesCatalog.name);
}

export async function upsertSpecies(name: string, tamil?: string | null) {
  if (usingFileStore()) return fileStore.upsertSpecies(name, tamil);
  const trimmed = name.trim();
  if (!trimmed) return;
  const client = await db();
  const existing = await client
    .select()
    .from(speciesCatalog)
    .where(eq(speciesCatalog.name, trimmed))
    .limit(1);
  if (existing[0]) return existing[0];
  const row: SpeciesRow = {
    id: crypto.randomUUID(),
    name: trimmed,
    tamil: tamil ?? null,
    category: "custom",
    createdAt: new Date(),
  };
  await client.insert(speciesCatalog).values(row);
  return row;
}

export async function listZones(): Promise<ZoneRow[]> {
  if (usingFileStore()) return fileStore.listZones();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(farmZones).orderBy(farmZones.name);
}

export async function saveFarmBoundary(polygon: GeoPolygon | null) {
  if (usingFileStore()) return fileStore.saveFarmBoundary(polygon);
  const client = await db();
  const existing = await client
    .select()
    .from(farmZones)
    .where(eq(farmZones.name, "Farm boundary"))
    .limit(1);
  if (existing[0]) {
    await client.update(farmZones).set({ polygon }).where(eq(farmZones.id, existing[0].id));
    return;
  }
  await client.insert(farmZones).values({
    id: crypto.randomUUID(),
    name: "Farm boundary",
    polygon,
    createdAt: new Date(),
  });
}

export async function listTrees(): Promise<TreeRow[]> {
  if (usingFileStore()) return fileStore.listTrees();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(trees).orderBy(desc(trees.createdAt));
}

export async function getTree(id: string): Promise<TreeRow | null> {
  if (usingFileStore()) return fileStore.getTree(id);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(trees).where(eq(trees.id, id)).limit(1);
  return rows[0] ?? null;
}

export type NewTree = Omit<TreeRow, "id" | "createdAt" | "updatedAt"> & { id?: string };

export async function insertTree(input: NewTree) {
  const now = new Date();
  const row: TreeRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  if (usingFileStore()) return fileStore.insertTree(row);
  const client = await db();
  await client.insert(trees).values(row);
  return row;
}

export async function updateTree(id: string, patch: Partial<Omit<TreeRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (usingFileStore()) return fileStore.updateTree(id, next);
  const client = await db();
  await client.update(trees).set(next).where(eq(trees.id, id));
}

export async function nearbyTrees(lat: number, lng: number, excludeId?: string) {
  const all = await listTrees();
  return nearestPoints(
    { lat, lng },
    all.filter((tree) => tree.id !== excludeId),
  );
}

export type NewObservation = Omit<ObservationRow, "id" | "createdAt"> & { id?: string };

export async function insertObservation(input: NewObservation) {
  const row: ObservationRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (usingFileStore()) return fileStore.insertObservation(row);
  const client = await db();
  await client.insert(observations).values(row);
  return row;
}

export async function listObservations(
  opts: {
    domain?: ObservationDomain;
    treeId?: string;
    limit?: number;
  } = {},
): Promise<ObservationRow[]> {
  if (usingFileStore()) return fileStore.listObservations(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 80;
  if (opts.treeId) {
    return client
      .select()
      .from(observations)
      .where(eq(observations.treeId, opts.treeId))
      .orderBy(desc(observations.occurredAt))
      .limit(limit);
  }
  if (opts.domain) {
    return client
      .select()
      .from(observations)
      .where(eq(observations.domain, opts.domain))
      .orderBy(desc(observations.occurredAt))
      .limit(limit);
  }
  return client.select().from(observations).orderBy(desc(observations.occurredAt)).limit(limit);
}

export type NewDevice = Omit<DeviceRow, "id" | "createdAt" | "updatedAt"> & { id?: string };

export async function insertDevice(input: NewDevice) {
  const now = new Date();
  const row: DeviceRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  if (usingFileStore()) return fileStore.insertDevice(row);
  const client = await db();
  await client.insert(farmDevices).values(row);
  return row;
}

export async function listDevices(): Promise<DeviceRow[]> {
  if (usingFileStore()) return fileStore.listDevices();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(farmDevices).orderBy(farmDevices.name);
}

export async function getDevice(id: string): Promise<DeviceRow | null> {
  if (usingFileStore()) return fileStore.getDevice(id);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(farmDevices).where(eq(farmDevices.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDeviceByToken(token: string): Promise<DeviceRow | null> {
  if (usingFileStore()) return fileStore.getDeviceByToken(token);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(farmDevices).where(eq(farmDevices.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function updateDevice(id: string, patch: Partial<Omit<DeviceRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (usingFileStore()) return fileStore.updateDevice(id, next);
  const client = await db();
  await client.update(farmDevices).set(next).where(eq(farmDevices.id, id));
}

export async function deleteDevice(id: string) {
  if (usingFileStore()) return fileStore.deleteDevice(id);
  const client = await db();
  await client.delete(deviceReadings).where(eq(deviceReadings.deviceId, id));
  await client.delete(farmDevices).where(eq(farmDevices.id, id));
}

export type NewReading = Omit<ReadingRow, "id" | "createdAt"> & { id?: string };

export async function insertReading(input: NewReading) {
  const row: ReadingRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (usingFileStore()) return fileStore.insertReading(row);
  const client = await db();
  await client.insert(deviceReadings).values(row);
  return row;
}

export async function listReadings(
  opts: { deviceId?: string; limit?: number } = {},
): Promise<ReadingRow[]> {
  if (usingFileStore()) return fileStore.listReadings(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 40;
  if (opts.deviceId) {
    return client
      .select()
      .from(deviceReadings)
      .where(eq(deviceReadings.deviceId, opts.deviceId))
      .orderBy(desc(deviceReadings.occurredAt))
      .limit(limit);
  }
  return client.select().from(deviceReadings).orderBy(desc(deviceReadings.occurredAt)).limit(limit);
}

export async function dashboardStats() {
  if (usingFileStore()) return fileStore.dashboardStats();
  if (!isDatabaseConfigured()) return emptyDashboardStats();
  const client = await db();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [treeRows, weekLogs, healthRows, lastByDomain, speciesCounts] = await Promise.all([
    client.select({ count: sql<number>`count(*)::int` }).from(trees),
    client
      .select({
        domain: observations.domain,
        count: sql<number>`count(*)::int`,
      })
      .from(observations)
      .where(gte(observations.occurredAt, weekAgo))
      .groupBy(observations.domain),
    client
      .select({
        health: trees.health,
        count: sql<number>`count(*)::int`,
      })
      .from(trees)
      .groupBy(trees.health),
    client
      .select({
        domain: observations.domain,
        occurredAt: sql<Date>`max(${observations.occurredAt})`,
      })
      .from(observations)
      .groupBy(observations.domain),
    client
      .select({
        species: trees.species,
        count: sql<number>`count(*)::int`,
      })
      .from(trees)
      .groupBy(trees.species),
  ]);

  return {
    treeCount: Number(treeRows[0]?.count ?? 0),
    weekByDomain: Object.fromEntries(weekLogs.map((row) => [row.domain, Number(row.count)])),
    lastByDomain: Object.fromEntries(
      lastByDomain.map((row) => [row.domain, row.occurredAt ? new Date(row.occurredAt) : null]),
    ),
    healthCounts: Object.fromEntries(healthRows.map((row) => [row.health, Number(row.count)])) as Partial<
      Record<TreeHealth, number>
    >,
    speciesCounts: speciesCounts
      .map((row) => ({ species: row.species, count: Number(row.count) }))
      .sort((a, b) => b.count - a.count),
  };
}

export function emptyDashboardStats() {
  return {
    treeCount: 0,
    weekByDomain: {} as Record<string, number>,
    lastByDomain: {} as Record<string, Date | null>,
    healthCounts: {} as Partial<Record<TreeHealth, number>>,
    speciesCounts: [] as { species: string; count: number }[],
  };
}
