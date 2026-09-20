import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { chartOfAccounts } from "@/lib/accounts";
import { seedFarmProfile } from "@/lib/farm.config";
import { mintDeviceToken } from "@/lib/iot/tokens";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  farmSql?: ReturnType<typeof postgres>;
  farmDb?: Database;
  farmDbReady?: boolean | number;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.farmSql) {
    const url = process.env.DATABASE_URL;
    const local = url.includes("localhost") || url.includes("127.0.0.1");
    globalForDb.farmSql = postgres(url, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: local ? false : "require",
    });
  }
  return globalForDb.farmSql;
}

export function getDb() {
  if (!globalForDb.farmDb) {
    globalForDb.farmDb = drizzle(getSql(), { schema });
  }
  return globalForDb.farmDb;
}

export async function ensureSchema() {
  if (!process.env.DATABASE_URL) return;
  if (globalForDb.farmDbReady === 3) return;
  const sql = getSql();

  await sql`CREATE TABLE IF NOT EXISTS species_catalog (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    tamil text,
    category text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS farm_zones (
    id text PRIMARY KEY,
    name text NOT NULL,
    polygon jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS plots (
    id text PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL,
    polygon jsonb,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS animals (
    id text PRIMARY KEY,
    name text NOT NULL,
    species text NOT NULL,
    sex text,
    tag text,
    born_on date,
    status text NOT NULL DEFAULT 'active',
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS trees (
    id text PRIMARY KEY,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    accuracy_m double precision,
    species text NOT NULL,
    planting_year integer,
    planted_on date,
    health text NOT NULL DEFAULT 'healthy',
    habit text,
    photo_url text,
    ai_suggestion jsonb,
    zone text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS trees_species_idx ON trees (species)`;
  await sql`CREATE INDEX IF NOT EXISTS trees_health_idx ON trees (health)`;

  await sql`CREATE TABLE IF NOT EXISTS observations (
    id text PRIMARY KEY,
    domain text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    note text,
    photo_url text,
    lat double precision,
    lng double precision,
    accuracy_m double precision,
    weather jsonb,
    details jsonb,
    tree_id text,
    plot_id text,
    animal_id text,
    source text,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`ALTER TABLE observations ADD COLUMN IF NOT EXISTS plot_id text`;
  await sql`ALTER TABLE observations ADD COLUMN IF NOT EXISTS animal_id text`;
  await sql`ALTER TABLE observations ADD COLUMN IF NOT EXISTS plant_stand_id text`;
  await sql`ALTER TABLE observations ADD COLUMN IF NOT EXISTS source text`;
  await sql`ALTER TABLE observations ADD COLUMN IF NOT EXISTS created_by text`;

  await sql`CREATE INDEX IF NOT EXISTS observations_domain_occurred_idx ON observations (domain, occurred_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS observations_plot_idx ON observations (plot_id)`;

  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY,
    title text NOT NULL,
    due_at timestamptz,
    source text NOT NULL,
    domain text,
    tree_id text,
    plot_id text,
    animal_id text,
    completed_at timestamptz,
    completed_observation_id text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS briefs (
    id text PRIMARY KEY,
    kind text NOT NULL,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    markdown text NOT NULL,
    stats jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS ledger (
    id text PRIMARY KEY,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    kind text NOT NULL,
    category text NOT NULL,
    amount double precision NOT NULL,
    note text,
    observation_id text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS farm_profile (
    id text PRIMARY KEY,
    config jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS plant_stands (
    id text PRIMARY KEY,
    name text NOT NULL,
    crop text NOT NULL,
    stage text NOT NULL DEFAULT 'growing',
    plot_id text,
    planted_on date,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS devices (
    id text PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL,
    protocol text NOT NULL DEFAULT 'http',
    token_hash text,
    plot_id text,
    plant_stand_id text,
    tree_id text,
    animal_id text,
    lat double precision,
    lng double precision,
    firmware text,
    last_seen_at timestamptz,
    battery_v double precision,
    rssi double precision,
    config jsonb,
    status text NOT NULL DEFAULT 'offline',
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS devices_kind_idx ON devices (kind)`;
  await sql`CREATE INDEX IF NOT EXISTS devices_status_idx ON devices (status)`;

  await sql`CREATE TABLE IF NOT EXISTS readings (
    id text NOT NULL,
    device_id text NOT NULL,
    metric text NOT NULL,
    value double precision NOT NULL,
    unit text,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    payload jsonb
  )`;
  await sql`CREATE INDEX IF NOT EXISTS readings_device_recorded_idx ON readings (device_id, recorded_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS readings_metric_idx ON readings (metric, recorded_at DESC)`;

  await sql`CREATE TABLE IF NOT EXISTS alerts (
    id text PRIMARY KEY,
    title text NOT NULL,
    detail text,
    device_id text,
    rule_id text,
    acknowledged_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS firmware_artifacts (
    id text PRIMARY KEY,
    device_kind text NOT NULL,
    version text NOT NULL,
    url text NOT NULL,
    sha256 text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS timescaledb`;
    await sql.unsafe(`SELECT create_hypertable('readings', 'recorded_at', if_not_exists => TRUE)`);
  } catch {
    /* vanilla Postgres is fine — readings stay a regular table */
  }

  const seed = seedFarmProfile();

  const existingSpecies = await sql`SELECT count(*)::int AS count FROM species_catalog`;
  if (!existingSpecies[0]?.count) {
    for (const row of seed.seedSpecies) {
      await sql`INSERT INTO species_catalog (id, name, tamil, category, created_at)
        VALUES (${crypto.randomUUID()}, ${row.name}, ${row.tamil}, ${row.category}, now())
        ON CONFLICT (name) DO NOTHING`;
    }
  }

  const existingZones = await sql`SELECT count(*)::int AS count FROM farm_zones`;
  if (!existingZones[0]?.count) {
    for (const name of seed.zoneLabels) {
      await sql`INSERT INTO farm_zones (id, name, polygon, created_at)
        VALUES (${crypto.randomUUID()}, ${name}, NULL, now())`;
    }
    await sql`INSERT INTO farm_zones (id, name, polygon, created_at)
      VALUES (${crypto.randomUUID()}, ${"Farm boundary"}, NULL, now())`;
  }

  const existingPlots = await sql`SELECT count(*)::int AS count FROM plots`;
  if (!existingPlots[0]?.count) {
    for (const plot of seed.seedPlots) {
      await sql`INSERT INTO plots (id, name, kind, polygon, note, created_at)
        VALUES (${crypto.randomUUID()}, ${plot.name}, ${plot.kind}, NULL, NULL, now())`;
    }
  }

  const existingProfile = await sql`SELECT count(*)::int AS count FROM farm_profile`;
  if (!existingProfile[0]?.count) {
    await getDb().insert(schema.farmProfile).values({
      id: "farm",
      config: seed as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    });
  }

  await sql`CREATE TABLE IF NOT EXISTS book_accounts (
    id text PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    tamil text,
    type text NOT NULL,
    group_name text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS book_parties (
    id text PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL,
    gstin text,
    pan text,
    phone text,
    upi text,
    place text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS book_vouchers (
    id text PRIMARY KEY,
    number text NOT NULL,
    kind text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    fy text NOT NULL,
    party_id text,
    party_name text,
    narration text,
    gross_paise integer NOT NULL,
    taxable_paise integer NOT NULL,
    gst_rate integer NOT NULL DEFAULT 0,
    gst_kind text NOT NULL,
    cgst_paise integer NOT NULL DEFAULT 0,
    sgst_paise integer NOT NULL DEFAULT 0,
    igst_paise integer NOT NULL DEFAULT 0,
    payment_mode text NOT NULL,
    category_account_id text NOT NULL,
    wallet_account_id text NOT NULL,
    transfer_to_id text,
    photo_url text,
    sms_raw text,
    sms_hash text,
    source text NOT NULL,
    gstin text,
    invoice_no text,
    hsn text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS book_vouchers_occurred_idx ON book_vouchers (occurred_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS book_vouchers_fy_idx ON book_vouchers (fy)`;
  await sql`CREATE INDEX IF NOT EXISTS book_vouchers_sms_hash_idx ON book_vouchers (sms_hash)`;

  await sql`CREATE TABLE IF NOT EXISTS book_lines (
    id text PRIMARY KEY,
    voucher_id text NOT NULL,
    account_id text NOT NULL,
    debit_paise integer NOT NULL DEFAULT 0,
    credit_paise integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS book_lines_voucher_idx ON book_lines (voucher_id)`;
  await sql`CREATE INDEX IF NOT EXISTS book_lines_account_idx ON book_lines (account_id)`;

  await sql`CREATE TABLE IF NOT EXISTS book_settings (
    id text PRIMARY KEY,
    gstin text,
    pan text,
    sms_token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  const existingAccounts = await sql`SELECT count(*)::int AS count FROM book_accounts`;
  if (!existingAccounts[0]?.count) {
    for (const row of chartOfAccounts) {
      await sql`INSERT INTO book_accounts (id, code, name, tamil, type, group_name, created_at)
        VALUES (${row.id}, ${row.code}, ${row.name}, ${row.tamil}, ${row.type}, ${row.group}, now())
        ON CONFLICT (id) DO NOTHING`;
    }
  }

  const existingSettings = await sql`SELECT count(*)::int AS count FROM book_settings`;
  if (!existingSettings[0]?.count) {
    await sql`INSERT INTO book_settings (id, gstin, pan, sms_token, created_at, updated_at)
      VALUES (${"farm"}, NULL, NULL, ${mintDeviceToken()}, now(), now())`;
  }

  globalForDb.farmDbReady = 3;
}
