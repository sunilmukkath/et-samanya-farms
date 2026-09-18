import { index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

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
  "kit",
] as const;

export type ObservationDomain = (typeof observationDomains)[number];

export const observationSources = ["operator", "staff", "sensor", "drone", "voice"] as const;
export type ObservationSource = (typeof observationSources)[number];

export const treeHealth = ["healthy", "watch", "stressed", "dead"] as const;
export type TreeHealth = (typeof treeHealth)[number];

export const treeHabits = ["sapling", "young", "mature"] as const;
export type TreeHabit = (typeof treeHabits)[number];

export const plotKinds = ["horticulture", "solo", "animal", "pond", "trees", "other"] as const;
export type PlotKind = (typeof plotKinds)[number];

export const taskSources = ["ai", "human"] as const;
export type TaskSource = (typeof taskSources)[number];

export const ledgerKinds = ["expense", "income"] as const;
export type LedgerKind = (typeof ledgerKinds)[number];

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
  issue?: string | null;
  culturalControl?: string | null;
  compostMaturity?: string | null;
  cattleCondition?: string | null;
};

export type ObservationDetails = {
  crop?: string;
  quantity?: number;
  unit?: string;
  destination?: string;
  pondLevel?: string;
  rainMm?: number;
  irrigationMinutes?: number;
  pumpOn?: boolean;
  canalNote?: string;
  tankLevel?: string;
  guestCount?: number;
  stayFrom?: string;
  stayTo?: string;
  activityType?: string;
  attendees?: number;
  animalKind?: string;
  animalCount?: number;
  animalCondition?: string;
  feedKg?: number;
  severity?: string;
  stage?: string;
  moisture?: string;
  action?: string;
  hours?: number;
  who?: string;
  kitItem?: string;
  kitStatus?: string;
  sensorId?: string;
  voiceLang?: string;
  aiSuggestion?: AiSuggestion;
};

export type BriefStats = {
  treeCount: number;
  watchCount: number;
  weekByDomain: Record<string, number>;
  rainMmLogged: number;
  harvestKg: number;
  openTasks: number;
  notes: string[];
  speciesWatch?: Record<string, number>;
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

export const plots = pgTable("plots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").$type<PlotKind>().notNull(),
  polygon: jsonb("polygon").$type<GeoPolygon | null>(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const animals = pgTable("animals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  sex: text("sex"),
  tag: text("tag"),
  bornOn: timestamp("born_on", { mode: "date" }),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
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
    plotId: text("plot_id"),
    animalId: text("animal_id"),
    source: text("source").$type<ObservationSource | null>(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("observations_domain_occurred_idx").on(t.domain, t.occurredAt),
    index("observations_plot_idx").on(t.plotId),
  ],
);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
  source: text("source").$type<TaskSource>().notNull(),
  domain: text("domain").$type<ObservationDomain | null>(),
  treeId: text("tree_id"),
  plotId: text("plot_id"),
  animalId: text("animal_id"),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  completedObservationId: text("completed_observation_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const briefs = pgTable("briefs", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true, mode: "date" }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }).notNull(),
  markdown: text("markdown").notNull(),
  stats: jsonb("stats").$type<BriefStats>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const ledger = pgTable("ledger", {
  id: text("id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  kind: text("kind").$type<LedgerKind>().notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  observationId: text("observation_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export type SpeciesRow = typeof speciesCatalog.$inferSelect;
export type ZoneRow = typeof farmZones.$inferSelect;
export type PlotRow = typeof plots.$inferSelect;
export type AnimalRow = typeof animals.$inferSelect;
export type TreeRow = typeof trees.$inferSelect;
export type ObservationRow = typeof observations.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type BriefRow = typeof briefs.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;
