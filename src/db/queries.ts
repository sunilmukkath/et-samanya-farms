import { desc, eq, gte, sql } from "drizzle-orm";
import { fileStore } from "@/db/file-store";
import { ensureSchema, getDb, isDatabaseConfigured } from "@/db/index";
import {
  bookAccounts,
  bookLines,
  bookParties,
  bookSettings,
  bookVouchers,
  deviceReadings,
  farmDevices,
  farmZones,
  observations,
  speciesCatalog,
  trees,
  type BookAccountRow,
  type BookLineRow,
  type BookPartyRow,
  type BookSettingsRow,
  type BookVoucherRow,
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
import { newDeviceToken } from "@/lib/equipment";

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

export async function listBookAccounts(): Promise<BookAccountRow[]> {
  if (usingFileStore()) return fileStore.listBookAccounts();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(bookAccounts).orderBy(bookAccounts.code);
}

export async function getBookSettings(): Promise<BookSettingsRow | null> {
  if (usingFileStore()) return fileStore.getBookSettings();
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookSettings).limit(1);
  if (rows[0]) return rows[0];
  const now = new Date();
  const row: BookSettingsRow = {
    id: "farm",
    gstin: null,
    pan: null,
    smsToken: newDeviceToken(),
    createdAt: now,
    updatedAt: now,
  };
  await client.insert(bookSettings).values(row);
  return row;
}

export async function saveBookSettings(patch: Partial<BookSettingsRow>) {
  if (usingFileStore()) return fileStore.saveBookSettings(patch);
  const current = await getBookSettings();
  if (!current) return;
  const next = { ...current, ...patch, updatedAt: new Date() };
  const client = await db();
  await client.update(bookSettings).set(next).where(eq(bookSettings.id, current.id));
  return next;
}

export async function listParties(): Promise<BookPartyRow[]> {
  if (usingFileStore()) return fileStore.listParties();
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  return client.select().from(bookParties).orderBy(bookParties.name);
}

export async function upsertParty(name: string, extra?: Partial<BookPartyRow>) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (usingFileStore()) {
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
  if (usingFileStore()) return fileStore.listVouchers(opts);
  if (!isDatabaseConfigured()) return [];
  const client = await db();
  const limit = opts.limit ?? 80;
  const rows = await client.select().from(bookVouchers).orderBy(desc(bookVouchers.occurredAt)).limit(400);
  return rows
    .filter((row) => (opts.fy ? row.fy === opts.fy : true) && (opts.kind ? row.kind === opts.kind : true))
    .slice(0, limit);
}

export async function getVoucher(id: string) {
  if (usingFileStore()) return fileStore.getVoucher(id);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookVouchers).where(eq(bookVouchers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getVoucherBySmsHash(hash: string) {
  if (usingFileStore()) return fileStore.getVoucherBySmsHash(hash);
  if (!isDatabaseConfigured()) return null;
  const client = await db();
  const rows = await client.select().from(bookVouchers).where(eq(bookVouchers.smsHash, hash)).limit(1);
  return rows[0] ?? null;
}

export async function listLines(
  opts: { voucherId?: string; accountId?: string; limit?: number } = {},
): Promise<BookLineRow[]> {
  if (usingFileStore()) return fileStore.listLines(opts);
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
  if (usingFileStore()) return fileStore.deleteVoucher(id);
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
  if (usingFileStore()) return fileStore.insertVoucher(voucher, lines);
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
