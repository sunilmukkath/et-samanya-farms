import { and, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { fileStore } from "@/db/file-store";
import { ensureSchema, getDb, isDatabaseConfigured } from "@/db/index";
import {
  alerts,
  animals,
  bookAccounts,
  bookLines,
  bookParties,
  bookSettings,
  bookVouchers,
  briefs,
  devices,
  farmProfile,
  farmZones,
  firmwareArtifacts,
  ledger,
  observations,
  plantStands,
  plots,
  readings,
  speciesCatalog,
  tasks,
  trees,
  type AlertRow,
  type AnimalRow,
  type BookAccountRow,
  type BookLineRow,
  type BookPartyRow,
  type BookSettingsRow,
  type BookVoucherRow,
  type BriefRow,
  type DeviceKind,
  type DeviceRow,
  type DeviceStatus,
  type FirmwareRow,
  type GeoPolygon,
  type LedgerRow,
  type ObservationDomain,
  type ObservationRow,
  type PlantStandRow,
  type PlotKind,
  type PlotRow,
  type ReadingRow,
  type SpeciesRow,
  type TaskRow,
  type TreeHealth,
  type TreeRow,
  type ZoneRow,
} from "@/db/schema";
import type { FarmProfile } from "@/lib/packs/types";
import {
  accountById,
  buildLedgerLines,
  financialYear,
  gstBreakup,
  nextVoucherNo,
  type GstKind,
  type PaymentMode,
  type VoucherKind,
  type VoucherSource,
} from "@/lib/accounts";
import { mintDeviceToken } from "@/lib/iot/tokens";
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
  "id" | "createdAt" | "plotId" | "animalId" | "plantStandId" | "source" | "createdBy"
> & {
  id?: string;
  plotId?: string | null;
  animalId?: string | null;
  plantStandId?: string | null;
  source?: ObservationRow["source"];
  createdBy?: string | null;
};

export async function insertObservation(input: NewObservation) {
  const row: ObservationRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    plotId: input.plotId ?? null,
    animalId: input.animalId ?? null,
    plantStandId: input.plantStandId ?? null,
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
    plantStandId?: string;
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
  if (opts.plantStandId) filters.push(eq(observations.plantStandId, opts.plantStandId));
  if (opts.domain) filters.push(eq(observations.domain, opts.domain));
  if (opts.since) filters.push(gte(observations.occurredAt, opts.since));
  if (opts.query) {
    const q = `%${opts.query.replace(/[%_]/g, "")}%`;
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

export async function getFarmProfileRecord(): Promise<FarmProfile | null> {
  if (fileStoreEnabled()) return fileStore.getFarmProfileRecord();
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(farmProfile).limit(1);
  const config = rows[0]?.config;
  if (!config || typeof config !== "object") return null;
  return config as FarmProfile;
}

export async function saveFarmProfileRecord(profile: FarmProfile) {
  const row = { id: "farm", config: profile as unknown as Record<string, unknown>, updatedAt: new Date() };
  if (fileStoreEnabled()) return fileStore.saveFarmProfileRecord(profile);
  const client = await db();
  const existing = await client.select({ id: farmProfile.id }).from(farmProfile).limit(1);
  if (existing[0]) {
    await client.update(farmProfile).set({ config: row.config, updatedAt: row.updatedAt }).where(eq(farmProfile.id, existing[0].id));
    return profile;
  }
  await client.insert(farmProfile).values(row);
  return profile;
}

export async function listPlantStands(): Promise<PlantStandRow[]> {
  if (fileStoreEnabled()) return fileStore.listPlantStands();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(plantStands).orderBy(plantStands.name);
}

export async function insertPlantStand(
  input: Omit<PlantStandRow, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const now = new Date();
  const row: PlantStandRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  if (fileStoreEnabled()) return fileStore.insertPlantStand(row);
  const client = await db();
  await client.insert(plantStands).values(row);
  return row;
}

export async function updatePlantStand(id: string, patch: Partial<Omit<PlantStandRow, "id" | "createdAt">>) {
  const next = { ...patch, updatedAt: new Date() };
  if (fileStoreEnabled()) return fileStore.updatePlantStand(id, next);
  const client = await db();
  await client.update(plantStands).set(next).where(eq(plantStands.id, id));
}

export async function listDevices(): Promise<DeviceRow[]> {
  if (fileStoreEnabled()) return fileStore.listDevices();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(devices).orderBy(devices.name);
}

export async function getDevice(id: string): Promise<DeviceRow | null> {
  if (fileStoreEnabled()) return fileStore.getDevice(id);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(devices).where(eq(devices.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDeviceByTokenHash(tokenHash: string): Promise<DeviceRow | null> {
  if (fileStoreEnabled()) return fileStore.getDeviceByTokenHash(tokenHash);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(devices).where(eq(devices.tokenHash, tokenHash)).limit(1);
  return rows[0] ?? null;
}

export async function insertDevice(input: Omit<DeviceRow, "id" | "createdAt"> & { id?: string }) {
  const row: DeviceRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertDevice(row);
  const client = await db();
  await client.insert(devices).values(row);
  return row;
}

export async function updateDevice(id: string, patch: Partial<Omit<DeviceRow, "id" | "createdAt">>) {
  if (fileStoreEnabled()) return fileStore.updateDevice(id, patch);
  const client = await db();
  await client.update(devices).set(patch).where(eq(devices.id, id));
}

export async function insertReading(input: Omit<ReadingRow, "id"> & { id?: string }) {
  const row: ReadingRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
  };
  if (fileStoreEnabled()) return fileStore.insertReading(row);
  const client = await db();
  await client.insert(readings).values(row);
  return row;
}

export async function listReadings(
  opts: { deviceId?: string; metric?: string; since?: Date; limit?: number } = {},
): Promise<ReadingRow[]> {
  if (fileStoreEnabled()) return fileStore.listReadings(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const filters = [];
  if (opts.deviceId) filters.push(eq(readings.deviceId, opts.deviceId));
  if (opts.metric) filters.push(eq(readings.metric, opts.metric));
  if (opts.since) filters.push(gte(readings.recordedAt, opts.since));
  const where = filters.length ? and(...filters) : undefined;
  return client
    .select()
    .from(readings)
    .where(where)
    .orderBy(desc(readings.recordedAt))
    .limit(opts.limit ?? 200);
}

export async function latestReadings(): Promise<ReadingRow[]> {
  if (fileStoreEnabled()) return fileStore.latestReadings();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const rows = await client.select().from(readings).orderBy(desc(readings.recordedAt)).limit(4000);
  const map = new Map<string, ReadingRow>();
  for (const row of rows) {
    const key = `${row.deviceId}:${row.metric}`;
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

export async function listAlerts(includeAck = false): Promise<AlertRow[]> {
  if (fileStoreEnabled()) return fileStore.listAlerts(includeAck);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  if (includeAck) {
    return client.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(80);
  }
  return client.select().from(alerts).where(isNull(alerts.acknowledgedAt)).orderBy(desc(alerts.createdAt)).limit(80);
}

export async function insertAlert(input: Omit<AlertRow, "id" | "createdAt"> & { id?: string }) {
  const row: AlertRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertAlert(row);
  const client = await db();
  const open = await client
    .select()
    .from(alerts)
    .where(and(isNull(alerts.acknowledgedAt), eq(alerts.title, row.title)));
  if (open.some((alert) => alert.deviceId === row.deviceId)) return open[0];
  await client.insert(alerts).values(row);
  return row;
}

export async function acknowledgeAlert(id: string) {
  if (fileStoreEnabled()) return fileStore.acknowledgeAlert(id);
  const client = await db();
  await client.update(alerts).set({ acknowledgedAt: new Date() }).where(eq(alerts.id, id));
}

export async function listFirmware(): Promise<FirmwareRow[]> {
  if (fileStoreEnabled()) return fileStore.listFirmware();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(firmwareArtifacts).orderBy(desc(firmwareArtifacts.createdAt));
}

export async function insertFirmware(input: Omit<FirmwareRow, "id" | "createdAt"> & { id?: string }) {
  const row: FirmwareRow = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date(),
  };
  if (fileStoreEnabled()) return fileStore.insertFirmware(row);
  const client = await db();
  await client.insert(firmwareArtifacts).values(row);
  return row;
}

export async function markStaleDevices(staleMinutes = 120) {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
  const rows = await listDevices();
  for (const device of rows) {
    if (device.status === "offline") continue;
    const seen = device.lastSeenAt;
    if (!seen || seen < cutoff) {
      await updateDevice(device.id, { status: "stale" satisfies DeviceStatus });
    }
  }
}

export async function listBookAccounts(): Promise<BookAccountRow[]> {
  if (fileStoreEnabled()) return fileStore.listBookAccounts();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(bookAccounts).orderBy(bookAccounts.code);
}

export async function getBookSettings(): Promise<BookSettingsRow | null> {
  if (fileStoreEnabled()) return fileStore.getBookSettings();
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookSettings).limit(1);
  if (rows[0]) return rows[0];
  const now = new Date();
  const row: BookSettingsRow = {
    id: "farm",
    gstin: null,
    pan: null,
    smsToken: mintDeviceToken(),
    createdAt: now,
    updatedAt: now,
  };
  await client.insert(bookSettings).values(row);
  return row;
}

export async function saveBookSettings(patch: Partial<BookSettingsRow>) {
  if (fileStoreEnabled()) return fileStore.saveBookSettings(patch);
  const current = await getBookSettings();
  if (!current) return;
  const next = { ...current, ...patch, updatedAt: new Date() };
  const client = await db();
  await client.update(bookSettings).set(next).where(eq(bookSettings.id, current.id));
  return next;
}

export async function listParties(): Promise<BookPartyRow[]> {
  if (fileStoreEnabled()) return fileStore.listParties();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(bookParties).orderBy(bookParties.name);
}

export async function upsertParty(name: string, extra?: Partial<BookPartyRow>) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (fileStoreEnabled()) {
    return fileStore.upsertParty({
      id: crypto.randomUUID(),
      name: trimmed,
      kind: extra?.kind ?? "vendor",
      gstin: extra?.gstin ?? null,
      pan: extra?.pan ?? null,
      phone: extra?.phone ?? null,
      upi: extra?.upi ?? null,
      place: extra?.place ?? null,
      createdAt: new Date(),
    });
  }
  const client = await db();
  const existing = await client.select().from(bookParties);
  const found = existing.find((row) => row.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  const row: BookPartyRow = {
    id: crypto.randomUUID(),
    name: trimmed,
    kind: extra?.kind ?? "vendor",
    gstin: extra?.gstin ?? null,
    pan: extra?.pan ?? null,
    phone: extra?.phone ?? null,
    upi: extra?.upi ?? null,
    place: extra?.place ?? null,
    createdAt: new Date(),
  };
  await client.insert(bookParties).values(row);
  return row;
}

export async function listVouchers(
  opts: { fy?: string; kind?: string; limit?: number } = {},
): Promise<BookVoucherRow[]> {
  if (fileStoreEnabled()) return fileStore.listVouchers(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 80;
  const rows = await client.select().from(bookVouchers).orderBy(desc(bookVouchers.occurredAt)).limit(400);
  return rows
    .filter((row) => (opts.fy ? row.fy === opts.fy : true) && (opts.kind ? row.kind === opts.kind : true))
    .slice(0, limit);
}

export async function getVoucher(id: string) {
  if (fileStoreEnabled()) return fileStore.getVoucher(id);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookVouchers).where(eq(bookVouchers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getVoucherBySmsHash(hash: string) {
  if (fileStoreEnabled()) return fileStore.getVoucherBySmsHash(hash);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookVouchers).where(eq(bookVouchers.smsHash, hash)).limit(1);
  return rows[0] ?? null;
}

export async function listLines(
  opts: { voucherId?: string; accountId?: string; limit?: number } = {},
): Promise<BookLineRow[]> {
  if (fileStoreEnabled()) return fileStore.listLines(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 200;
  if (opts.voucherId) {
    return client.select().from(bookLines).where(eq(bookLines.voucherId, opts.voucherId)).limit(limit);
  }
  if (opts.accountId) {
    return client.select().from(bookLines).where(eq(bookLines.accountId, opts.accountId)).limit(limit);
  }
  return client.select().from(bookLines).limit(limit);
}

export async function deleteVoucher(id: string) {
  if (fileStoreEnabled()) return fileStore.deleteVoucher(id);
  const client = await db();
  await client.delete(bookLines).where(eq(bookLines.voucherId, id));
  await client.delete(bookVouchers).where(eq(bookVouchers.id, id));
}

export type NewBookVoucher = {
  kind: VoucherKind;
  occurredAt: Date;
  partyName?: string | null;
  narration?: string | null;
  amountPaise: number;
  gstRate?: number;
  gstKind?: GstKind;
  gstInclusive?: boolean;
  paymentMode: PaymentMode;
  categoryAccountId: string;
  walletAccountId: string;
  transferToId?: string | null;
  photoUrl?: string | null;
  smsRaw?: string | null;
  smsHash?: string | null;
  source: VoucherSource;
  gstin?: string | null;
  invoiceNo?: string | null;
  hsn?: string | null;
};

export async function insertBookVoucher(input: NewBookVoucher) {
  if (input.amountPaise <= 0) throw new Error("Amount must be more than zero.");
  const fy = financialYear(input.occurredAt);
  const existing = await listVouchers({ fy: fy.label, limit: 500 });
  const gst = gstBreakup({
    amountPaise: input.amountPaise,
    rate: input.gstRate ?? 0,
    kind: input.gstKind ?? "none",
    inclusive: input.gstInclusive,
  });
  const linesDraft = buildLedgerLines({
    kind: input.kind,
    grossPaise: gst.grossPaise,
    gst,
    categoryAccountId: input.categoryAccountId,
    walletAccountId: input.walletAccountId,
    transferToId: input.transferToId,
  });
  const party = input.partyName ? await upsertParty(input.partyName) : null;
  const now = new Date();
  const voucher: BookVoucherRow = {
    id: crypto.randomUUID(),
    number: nextVoucherNo(
      existing.map((row) => row.number),
      fy,
    ),
    kind: input.kind,
    occurredAt: input.occurredAt,
    fy: fy.label,
    partyId: party?.id ?? null,
    partyName: party?.name ?? input.partyName ?? null,
    narration: input.narration ?? null,
    grossPaise: gst.grossPaise,
    taxablePaise: gst.taxablePaise,
    gstRate: input.gstRate ?? 0,
    gstKind: input.gstKind ?? "none",
    cgstPaise: gst.cgstPaise,
    sgstPaise: gst.sgstPaise,
    igstPaise: gst.igstPaise,
    paymentMode: input.paymentMode,
    categoryAccountId: input.categoryAccountId,
    walletAccountId: input.walletAccountId,
    transferToId: input.transferToId ?? null,
    photoUrl: input.photoUrl ?? null,
    smsRaw: input.smsRaw ?? null,
    smsHash: input.smsHash ?? null,
    source: input.source,
    gstin: input.gstin ?? null,
    invoiceNo: input.invoiceNo ?? null,
    hsn: input.hsn ?? null,
    createdAt: now,
  };
  const lines: BookLineRow[] = linesDraft.map((line) => ({
    id: crypto.randomUUID(),
    voucherId: voucher.id,
    accountId: line.accountId,
    debitPaise: line.debitPaise,
    creditPaise: line.creditPaise,
    createdAt: now,
  }));
  if (fileStoreEnabled()) return fileStore.insertVoucher(voucher, lines);
  const client = await db();
  await client.insert(bookVouchers).values(voucher);
  if (lines.length) await client.insert(bookLines).values(lines);
  return voucher;
}

export async function booksSnapshot(fyLabel?: string) {
  const fy = fyLabel ? financialYear(new Date(`${fyLabel.slice(0, 4)}-08-01T12:00:00+05:30`)) : financialYear();
  const vouchers = await listVouchers({ fy: fy.label, limit: 500 });
  const lines = await listLines({ limit: 4000 });
  const ids = new Set(vouchers.map((row) => row.id));
  const fyLines = lines.filter((row) => ids.has(row.voucherId));
  const balances: Record<string, number> = {};
  for (const line of fyLines) {
    balances[line.accountId] = (balances[line.accountId] ?? 0) + line.debitPaise - line.creditPaise;
  }
  const income = chartIncome(balances);
  const expense = chartExpense(balances);
  const monthKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(
    new Date(),
  );
  const thisMonth = vouchers.filter((row) => istYearMonth(row.occurredAt) === monthKey);
  const monthIn = thisMonth.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.grossPaise, 0);
  const monthOut = thisMonth.filter((row) => row.kind === "expense").reduce((sum, row) => sum + row.grossPaise, 0);
  return {
    fy,
    vouchers,
    balances,
    cash: balances.cash ?? 0,
    bank: balances.bank ?? 0,
    upi: balances.upi ?? 0,
    income,
    expense,
    profit: income - expense,
    monthIn,
    monthOut,
    inputGst: (balances.input_cgst ?? 0) + (balances.input_sgst ?? 0) + (balances.input_igst ?? 0),
    outputGst: -((balances.output_cgst ?? 0) + (balances.output_sgst ?? 0) + (balances.output_igst ?? 0)),
  };
}

function chartIncome(balances: Record<string, number>) {
  let sum = 0;
  for (const [id, value] of Object.entries(balances)) {
    if (accountById[id]?.type === "income") sum += -value;
  }
  return sum;
}

function chartExpense(balances: Record<string, number>) {
  let sum = 0;
  for (const [id, value] of Object.entries(balances)) {
    if (accountById[id]?.type === "expense") sum += value;
  }
  return sum;
}

function istYearMonth(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(date);
}

export type { DeviceKind, PlotKind };
