import type { DeviceKind, DeviceMetrics, DeviceStatus } from "@/lib/equipment";
import { index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const observationDomains = [
  "trees",
  "plants",
  "soil",
  "rain",
  "harvest",
  "animals",
  "plant_health",
  "stay",
  "activity",
] as const;

export type ObservationDomain = (typeof observationDomains)[number];

export const treeHealth = ["healthy", "watch", "stressed", "dead"] as const;
export type TreeHealth = (typeof treeHealth)[number];

export const treeHabits = ["sapling", "young", "mature"] as const;
export type TreeHabit = (typeof treeHabits)[number];

export type WeatherSnapshot = {
  tempC: number | null;
  humidity: number | null;
  rainMm: number | null;
  windKmh: number | null;
  code: number | null;
  weekRainMm: number | null;
  fetchedAt: string;
};

export type GeoPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type AiSuggestion = {
  species: string;
  tamil: string | null;
  habit: TreeHabit | null;
  health: TreeHealth | null;
  confidence: number;
  rationale: string;
};

export type ObservationDetails = {
  crop?: string;
  quantity?: number;
  unit?: string;
  pondLevel?: string;
  rainMm?: number;
  guestCount?: number;
  stayFrom?: string;
  stayTo?: string;
  activityType?: string;
  attendees?: number;
  animalKind?: string;
  animalCount?: number;
  animalCondition?: string;
  severity?: string;
  stage?: string;
  moisture?: string;
  action?: string;
  aiSuggestion?: AiSuggestion;
};

export const speciesCatalog = pgTable("species_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  tamil: text("tamil"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const farmZones = pgTable("farm_zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  polygon: jsonb("polygon").$type<GeoPolygon | null>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const trees = pgTable(
  "trees",
  {
    id: text("id").primaryKey(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    accuracyM: real("accuracy_m"),
    species: text("species").notNull(),
    plantingYear: integer("planting_year"),
    plantedOn: timestamp("planted_on", { mode: "date" }),
    health: text("health").$type<TreeHealth>().notNull(),
    habit: text("habit").$type<TreeHabit | null>(),
    photoUrl: text("photo_url"),
    aiSuggestion: jsonb("ai_suggestion").$type<AiSuggestion | null>(),
    zone: text("zone"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("trees_species_idx").on(t.species),
    index("trees_health_idx").on(t.health),
  ],
);

export const observations = pgTable(
  "observations",
  {
    id: text("id").primaryKey(),
    domain: text("domain").$type<ObservationDomain>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    note: text("note"),
    photoUrl: text("photo_url"),
    lat: real("lat"),
    lng: real("lng"),
    accuracyM: real("accuracy_m"),
    weather: jsonb("weather").$type<WeatherSnapshot | null>(),
    details: jsonb("details").$type<ObservationDetails | null>(),
    treeId: text("tree_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("observations_domain_occurred_idx").on(t.domain, t.occurredAt)],
);

export const farmDevices = pgTable(
  "farm_devices",
  {
    id: text("id").primaryKey(),
    kind: text("kind").$type<DeviceKind>().notNull(),
    name: text("name").notNull(),
    zone: text("zone"),
    vendor: text("vendor"),
    model: text("model"),
    token: text("token").notNull(),
    status: text("status").$type<DeviceStatus>().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }),
    lastMetrics: jsonb("last_metrics").$type<DeviceMetrics | null>(),
    desiredState: text("desired_state"),
    reportedState: text("reported_state"),
    streamUrl: text("stream_url"),
    snapshotUrl: text("snapshot_url"),
    note: text("note"),
    lat: real("lat"),
    lng: real("lng"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("farm_devices_kind_idx").on(t.kind), uniqueIndex("farm_devices_token_idx").on(t.token)],
);

export const deviceReadings = pgTable(
  "device_readings",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    metrics: jsonb("metrics").$type<DeviceMetrics>(),
    photoUrl: text("photo_url"),
    note: text("note"),
    lat: real("lat"),
    lng: real("lng"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("device_readings_device_occurred_idx").on(t.deviceId, t.occurredAt)],
);

export type SpeciesRow = typeof speciesCatalog.$inferSelect;
export type ZoneRow = typeof farmZones.$inferSelect;
export type TreeRow = typeof trees.$inferSelect;
export type ObservationRow = typeof observations.$inferSelect;
export type DeviceRow = typeof farmDevices.$inferSelect;
export type ReadingRow = typeof deviceReadings.$inferSelect;
