import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { seedSpecies, zoneLabels } from "@/lib/farm";
import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  farmSql?: ReturnType<typeof postgres>;
  farmDb?: Database;
  farmDbReady?: boolean;
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
  if (globalForDb.farmDbReady) return;
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
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS observations_domain_occurred_idx ON observations (domain, occurred_at DESC)`;

  await sql`CREATE TABLE IF NOT EXISTS farm_devices (
    id text PRIMARY KEY,
    kind text NOT NULL,
    name text NOT NULL,
    zone text,
    vendor text,
    model text,
    token text NOT NULL,
    status text NOT NULL DEFAULT 'planned',
    last_seen_at timestamptz,
    last_metrics jsonb,
    desired_state text,
    reported_state text,
    stream_url text,
    snapshot_url text,
    note text,
    lat double precision,
    lng double precision,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS farm_devices_kind_idx ON farm_devices (kind)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS farm_devices_token_idx ON farm_devices (token)`;

  await sql`CREATE TABLE IF NOT EXISTS device_readings (
    id text PRIMARY KEY,
    device_id text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    metrics jsonb,
    photo_url text,
    note text,
    lat double precision,
    lng double precision,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS device_readings_device_occurred_idx ON device_readings (device_id, occurred_at DESC)`;

  const existingSpecies = await sql`SELECT count(*)::int AS count FROM species_catalog`;
  if (!existingSpecies[0]?.count) {
    for (const row of seedSpecies) {
      await sql`INSERT INTO species_catalog (id, name, tamil, category, created_at)
        VALUES (${crypto.randomUUID()}, ${row.name}, ${row.tamil}, ${row.category}, now())
        ON CONFLICT (name) DO NOTHING`;
    }
  }

  const existingZones = await sql`SELECT count(*)::int AS count FROM farm_zones`;
  if (!existingZones[0]?.count) {
    for (const name of zoneLabels) {
      await sql`INSERT INTO farm_zones (id, name, polygon, created_at)
        VALUES (${crypto.randomUUID()}, ${name}, NULL, now())`;
    }
    await sql`INSERT INTO farm_zones (id, name, polygon, created_at)
      VALUES (${crypto.randomUUID()}, ${"Farm boundary"}, NULL, now())`;
  }

  globalForDb.farmDbReady = true;
}
