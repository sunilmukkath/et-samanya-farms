import { and, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { fileStore } from "@/db/file-store";
import { ensureSchema, getDb, isDatabaseConfigured } from "@/db/index";
import {
  animals,
  briefs,
  farmZones,
  ledger,
  observations,
  plots,
  speciesCatalog,
  tasks,
  trees,
  type AnimalRow,
  type BriefRow,
  type GeoPolygon,
  type LedgerRow,
  type ObservationDomain,
  type ObservationRow,
  type PlotKind,
  type PlotRow,
  type SpeciesRow,
  type TaskRow,
  type TreeHealth,
  type TreeRow,
  type ZoneRow,
} from "@/db/schema";
import { nearestPoints } from "@/lib/geo";

export { isDatabaseConfigured };

function fileStoreEnabled() {
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
  if (fileStoreEnabled()) return fileStore.listSpecies();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(speciesCatalog).orderBy(speciesCatalog.name);
}

export async function upsertSpecies(name: string, tamil?: string | null) {
  if (fileStoreEnabled()) return fileStore.upsertSpecies(name, tamil);
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
  if (fileStoreEnabled()) return fileStore.listZones();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(farmZones).orderBy(farmZones.name);
}

export async function saveFarmBoundary(polygon: GeoPolygon | null) {
  if (fileStoreEnabled()) return fileStore.saveFarmBoundary(polygon);
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

export async function listPlots(): Promise<PlotRow[]> {
  if (fileStoreEnabled()) return fileStore.listPlots();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(plots).orderBy(plots.name);
}

export async function insertPlot(input: Omit<PlotRow, "id" | "createdAt"> & { id?: string }) {
  const row: PlotRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertPlot(row);
  const client = await db();
  await client.insert(plots).values(row);
  return row;
}

export async function updatePlot(id: string, patch: Partial<Omit<PlotRow, "id" | "createdAt">>) {
  if (fileStoreEnabled()) return fileStore.updatePlot(id, patch);
  const client = await db();
  await client.update(plots).set(patch).where(eq(plots.id, id));
}

export async function listAnimals(): Promise<AnimalRow[]> {
  if (fileStoreEnabled()) return fileStore.listAnimals();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(animals).orderBy(animals.name);
}

export async function insertAnimal(input: Omit<AnimalRow, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = new Date();
  const row: AnimalRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  if (fileStoreEnabled()) return fileStore.insertAnimal(row);
  const client = await db();
  await client.insert(animals).values(row);
  return row;
}

export async function updateAnimal(id: string, patch: Partial<Omit<AnimalRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (fileStoreEnabled()) return fileStore.updateAnimal(id, next);
  const client = await db();
  await client.update(animals).set(next).where(eq(animals.id, id));
}

export async function listTrees(): Promise<TreeRow[]> {
  if (fileStoreEnabled()) return fileStore.listTrees();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(trees).orderBy(desc(trees.createdAt));
}

export async function getTree(id: string): Promise<TreeRow | null> {
  if (fileStoreEnabled()) return fileStore.getTree(id);
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
  if (fileStoreEnabled()) return fileStore.insertTree(row);
  const client = await db();
  await client.insert(trees).values(row);
  return row;
}

export async function updateTree(id: string, patch: Partial<Omit<TreeRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (fileStoreEnabled()) return fileStore.updateTree(id, next);
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

export type NewObservation = Omit<
  ObservationRow,
  "id" | "createdAt" | "plotId" | "animalId" | "source" | "createdBy"
> & {
  id?: string;
  plotId?: string | null;
  animalId?: string | null;
  source?: ObservationRow["source"];
  createdBy?: string | null;
};

export async function insertObservation(input: NewObservation) {
  const row: ObservationRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    plotId: input.plotId ?? null,
    animalId: input.animalId ?? null,
    source: input.source ?? null,
    createdBy: input.createdBy ?? null,
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertObservation(row);
  const client = await db();
  await client.insert(observations).values(row);
  return row;
}

export async function listObservations(
  opts: {
    domain?: ObservationDomain;
    treeId?: string;
    plotId?: string;
    animalId?: string;
    query?: string;
    since?: Date;
    limit?: number;
  } = {},
): Promise<ObservationRow[]> {
  if (fileStoreEnabled()) return fileStore.listObservations(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 80;
  const filters = [];
  if (opts.treeId) filters.push(eq(observations.treeId, opts.treeId));
  if (opts.plotId) filters.push(eq(observations.plotId, opts.plotId));
  if (opts.animalId) filters.push(eq(observations.animalId, opts.animalId));
  if (opts.domain) filters.push(eq(observations.domain, opts.domain));
  if (opts.since) filters.push(gte(observations.occurredAt, opts.since));
  if (opts.query) {
    const q = `%${opts.query}%`;
    filters.push(or(ilike(observations.note, q), sql`coalesce(${observations.details}::text, '') ilike ${q}`));
  }
  const where = filters.length ? and(...filters) : undefined;
  return client.select().from(observations).where(where).orderBy(desc(observations.occurredAt)).limit(limit);
}

export async function listRecentHarvest(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return listObservations({ domain: "harvest", since, limit: 40 });
}

export async function dashboardStats() {
  if (fileStoreEnabled()) return fileStore.dashboardStats();
  if (!isDatabaseConfigured()) return emptyDashboardStats();
  const client = await db();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [treeRows, weekLogs, healthRows, lastByDomain, speciesCounts, weekObs, openTaskRows] = await Promise.all([
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
    client.select().from(observations).where(gte(observations.occurredAt, weekAgo)),
    client.select({ count: sql<number>`count(*)::int` }).from(tasks).where(isNull(tasks.completedAt)),
  ]);

  let harvestKgWeek = 0;
  let rainMmWeek = 0;
  for (const row of weekObs) {
    if (row.domain === "harvest" && row.details?.quantity) harvestKgWeek += Number(row.details.quantity);
    if (row.domain === "rain" && row.details?.rainMm) rainMmWeek += Number(row.details.rainMm);
  }

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
    harvestKgWeek,
    rainMmWeek,
    openTasks: Number(openTaskRows[0]?.count ?? 0),
  };
}

export function emptyDashboardStats() {
  return {
    treeCount: 0,
    weekByDomain: {} as Record<string, number>,
    lastByDomain: {} as Record<string, Date | null>,
    healthCounts: {} as Partial<Record<TreeHealth, number>>,
    speciesCounts: [] as { species: string; count: number }[],
    harvestKgWeek: 0,
    rainMmWeek: 0,
    openTasks: 0,
  };
}

export async function listTasks(includeDone = false): Promise<TaskRow[]> {
  if (fileStoreEnabled()) return fileStore.listTasks(includeDone);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  if (includeDone) {
    return client.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(80);
  }
  return client.select().from(tasks).where(isNull(tasks.completedAt)).orderBy(desc(tasks.createdAt)).limit(80);
}

export async function insertTask(input: Omit<TaskRow, "id" | "createdAt"> & { id?: string }) {
  const row: TaskRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertTask(row);
  const client = await db();
  const open = await client
    .select()
    .from(tasks)
    .where(and(isNull(tasks.completedAt), eq(tasks.title, row.title)));
  if (open.some((task) => task.treeId === row.treeId && task.plotId === row.plotId)) return open[0];
  await client.insert(tasks).values(row);
  return row;
}

export async function completeTask(id: string, observationId: string | null) {
  if (fileStoreEnabled()) return fileStore.completeTask(id, observationId);
  const client = await db();
  await client
    .update(tasks)
    .set({ completedAt: new Date(), completedObservationId: observationId })
    .where(eq(tasks.id, id));
}

export async function latestBrief(kind?: string): Promise<BriefRow | null> {
  if (fileStoreEnabled()) return fileStore.latestBrief(kind);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  if (kind) {
    const rows = await client
      .select()
      .from(briefs)
      .where(eq(briefs.kind, kind))
      .orderBy(desc(briefs.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }
  const rows = await client.select().from(briefs).orderBy(desc(briefs.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function insertBrief(input: Omit<BriefRow, "id" | "createdAt"> & { id?: string }) {
  const row: BriefRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertBrief(row);
  const client = await db();
  await client.insert(briefs).values(row);
  return row;
}

export async function listLedger(limit = 80): Promise<LedgerRow[]> {
  if (fileStoreEnabled()) return fileStore.listLedger(limit);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(ledger).orderBy(desc(ledger.occurredAt)).limit(limit);
}

export async function insertLedger(input: Omit<LedgerRow, "id" | "createdAt"> & { id?: string }) {
  const row: LedgerRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertLedger(row);
  const client = await db();
  await client.insert(ledger).values(row);
  return row;
}

export async function listObservationsSince(since: Date, limit = 400) {
  return listObservations({ since, limit });
}

export type { PlotKind };
