import type { AccountType, GstKind, PaymentMode, VoucherKind, VoucherSource } from "@/lib/accounts";
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

export const deviceKinds = ["soil", "pond", "weather", "pump", "valve", "camera", "counter", "tank"] as const;
export type DeviceKind = (typeof deviceKinds)[number];

export const deviceProtocols = ["http", "mqtt", "lora"] as const;
export type DeviceProtocol = (typeof deviceProtocols)[number];

export const deviceStatuses = ["online", "stale", "error", "offline"] as const;
export type DeviceStatus = (typeof deviceStatuses)[number];

export const plantStandStages = ["seedling", "growing", "flowering", "harvest", "fallow"] as const;
export type PlantStandStage = (typeof plantStandStages)[number];

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
  plantStandId?: string;
  deviceId?: string;
  sprayProduct?: string;
  phiDays?: number;
  safeToPickOn?: string;
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
    plantStandId: text("plant_stand_id"),
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

export const farmProfile = pgTable("farm_profile", {
  id: text("id").primaryKey(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const plantStands = pgTable("plant_stands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  crop: text("crop").notNull(),
  stage: text("stage").$type<PlantStandStage>().notNull(),
  plotId: text("plot_id"),
  plantedOn: timestamp("planted_on", { mode: "date" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const devices = pgTable(
  "devices",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind").$type<DeviceKind>().notNull(),
    protocol: text("protocol").$type<DeviceProtocol>().notNull(),
    tokenHash: text("token_hash"),
    plotId: text("plot_id"),
    plantStandId: text("plant_stand_id"),
    treeId: text("tree_id"),
    animalId: text("animal_id"),
    lat: real("lat"),
    lng: real("lng"),
    firmware: text("firmware"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }),
    batteryV: real("battery_v"),
    rssi: real("rssi"),
    config: jsonb("config").$type<Record<string, unknown> | null>(),
    status: text("status").$type<DeviceStatus>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("devices_kind_idx").on(t.kind), index("devices_status_idx").on(t.status)],
);

export const readings = pgTable(
  "readings",
  {
    id: text("id").notNull(),
    deviceId: text("device_id").notNull(),
    metric: text("metric").notNull(),
    value: real("value").notNull(),
    unit: text("unit"),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "date" }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
  },
  (t) => [
    index("readings_device_recorded_idx").on(t.deviceId, t.recordedAt),
    index("readings_metric_idx").on(t.metric, t.recordedAt),
  ],
);

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  detail: text("detail"),
  deviceId: text("device_id"),
  ruleId: text("rule_id"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const firmwareArtifacts = pgTable("firmware_artifacts", {
  id: text("id").primaryKey(),
  deviceKind: text("device_kind").$type<DeviceKind>().notNull(),
  version: text("version").notNull(),
  url: text("url").notNull(),
  sha256: text("sha256"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const bookAccounts = pgTable(
  "book_accounts",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    tamil: text("tamil"),
    type: text("type").$type<AccountType>().notNull(),
    groupName: text("group_name"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [uniqueIndex("book_accounts_code_idx").on(t.code)],
);

export const bookParties = pgTable("book_parties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  gstin: text("gstin"),
  pan: text("pan"),
  phone: text("phone"),
  upi: text("upi"),
  place: text("place"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const bookVouchers = pgTable(
  "book_vouchers",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    kind: text("kind").$type<VoucherKind>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    fy: text("fy").notNull(),
    partyId: text("party_id"),
    partyName: text("party_name"),
    narration: text("narration"),
    grossPaise: integer("gross_paise").notNull(),
    taxablePaise: integer("taxable_paise").notNull(),
    gstRate: integer("gst_rate").notNull(),
    gstKind: text("gst_kind").$type<GstKind>().notNull(),
    cgstPaise: integer("cgst_paise").notNull(),
    sgstPaise: integer("sgst_paise").notNull(),
    igstPaise: integer("igst_paise").notNull(),
    paymentMode: text("payment_mode").$type<PaymentMode>().notNull(),
    categoryAccountId: text("category_account_id").notNull(),
    walletAccountId: text("wallet_account_id").notNull(),
    transferToId: text("transfer_to_id"),
    photoUrl: text("photo_url"),
    smsRaw: text("sms_raw"),
    smsHash: text("sms_hash"),
    source: text("source").$type<VoucherSource>().notNull(),
    gstin: text("gstin"),
    invoiceNo: text("invoice_no"),
    hsn: text("hsn"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("book_vouchers_occurred_idx").on(t.occurredAt),
    index("book_vouchers_fy_idx").on(t.fy),
    index("book_vouchers_sms_hash_idx").on(t.smsHash),
  ],
);

export const bookLines = pgTable(
  "book_lines",
  {
    id: text("id").primaryKey(),
    voucherId: text("voucher_id").notNull(),
    accountId: text("account_id").notNull(),
    debitPaise: integer("debit_paise").notNull(),
    creditPaise: integer("credit_paise").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("book_lines_voucher_idx").on(t.voucherId), index("book_lines_account_idx").on(t.accountId)],
);

export const bookSettings = pgTable("book_settings", {
  id: text("id").primaryKey(),
  gstin: text("gstin"),
  pan: text("pan"),
  smsToken: text("sms_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
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
export type FarmProfileRow = typeof farmProfile.$inferSelect;
export type PlantStandRow = typeof plantStands.$inferSelect;
export type DeviceRow = typeof devices.$inferSelect;
export type ReadingRow = typeof readings.$inferSelect;
export type AlertRow = typeof alerts.$inferSelect;
export type FirmwareRow = typeof firmwareArtifacts.$inferSelect;
export type BookAccountRow = typeof bookAccounts.$inferSelect;
export type BookPartyRow = typeof bookParties.$inferSelect;
export type BookVoucherRow = typeof bookVouchers.$inferSelect;
export type BookLineRow = typeof bookLines.$inferSelect;
export type BookSettingsRow = typeof bookSettings.$inferSelect;
