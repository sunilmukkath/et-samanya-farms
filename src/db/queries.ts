import { desc, eq, gte, sql } from "drizzle-orm";
import { fileStore } from "@/db/file-store";
import { ensureSchema, getDb, isDatabaseConfigured } from "@/db/index";
import {
  farmZones,
  observations,
  speciesCatalog,
  trees,
  type GeoPolygon,
  type ObservationDomain,
  type ObservationRow,
  type SpeciesRow,
  type TreeHealth,
  type TreeRow,
  type ZoneRow,
} from "@/db/schema";
import { nearestPoints } from "@/lib/geo";

export { isDatabaseConfigured };

function useFileStore() {
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
  if (useFileStore()) return fileStore.listSpecies();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(speciesCatalog).orderBy(speciesCatalog.name);
}

export async function upsertSpecies(name: string, tamil?: string | null) {
  if (useFileStore()) return fileStore.upsertSpecies(name, tamil);
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
  if (useFileStore()) return fileStore.listZones();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(farmZones).orderBy(farmZones.name);
}

export async function saveFarmBoundary(polygon: GeoPolygon | null) {
  if (useFileStore()) return fileStore.saveFarmBoundary(polygon);
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
  if (useFileStore()) return fileStore.listTrees();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(trees).orderBy(desc(trees.createdAt));
}

export async function getTree(id: string): Promise<TreeRow | null> {
  if (useFileStore()) return fileStore.getTree(id);
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
  if (useFileStore()) return fileStore.insertTree(row);
  const client = await db();
  await client.insert(trees).values(row);
  return row;
}

export async function updateTree(id: string, patch: Partial<Omit<TreeRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (useFileStore()) return fileStore.updateTree(id, next);
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
  if (useFileStore()) return fileStore.insertObservation(row);
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
  if (useFileStore()) return fileStore.listObservations(opts);
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

export async function dashboardStats() {
  if (useFileStore()) return fileStore.dashboardStats();
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
