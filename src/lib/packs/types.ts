import type { ObservationDomain, PlotKind } from "@/db/schema";

export const packIds = [
  "agroforestry",
  "horticulture",
  "livestock",
  "water",
  "permaculture",
  "stay",
  "energy",
] as const;

export type PackId = (typeof packIds)[number];

export const adminModules = [
  "map",
  "trees",
  "plots",
  "animals",
  "stands",
  "water",
  "stay",
  "ledger",
  "nodes",
  "season",
  "brief",
  "tasks",
] as const;

export type AdminModule = (typeof adminModules)[number];

export type AssetKind = "tree" | "bed" | "animal" | "pond";

export type MapPrimary = "trees" | "plots" | "animals" | "nodes";

export type VisionPack = "tree" | "plant_health" | "compost" | "cattle";

export type CaptureFieldType = "text" | "number" | "select" | "chips" | "date";

export type CaptureOptionsFrom =
  | "harvestCrops"
  | "harvestDestinations"
  | "kitItems"
  | "kitStatuses"
  | "activityTypes"
  | "pondLevels"
  | "health"
  | "animals"
  | "plantStands"
  | "cropsAndTree";

export type CaptureField = {
  name: string;
  label: string;
  type: CaptureFieldType;
  options?: string[];
  values?: string[];
  optionsFrom?: CaptureOptionsFrom;
  step?: string;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  defaultValue?: string;
  hintFrom?: "rainMm";
  colSpan?: 1 | 2;
  storeAs?: "boolean";
};

export type DomainDef = {
  slug: ObservationDomain;
  label: string;
  tamil: string;
  hint: string;
  photoDefault?: boolean;
  visionPack?: VisionPack;
  fields: CaptureField[];
};

export type FarmRule = {
  id: string;
  title: string;
  enabled: boolean;
  when: {
    metric?: string;
    deviceKind?: string;
    op: "lt" | "gt" | "eq" | "silent";
    value?: number;
    durationMin?: number;
  };
  then: {
    task: string;
    domain?: ObservationDomain;
    alert?: string;
  };
};

export type PracticePack = {
  id: PackId;
  label: string;
  description: string;
  modules: AdminModule[];
  domains: ObservationDomain[];
  assets: AssetKind[];
  mapPrimary: MapPrimary;
  overlay?: boolean;
};

export type SeedSpecies = { name: string; tamil: string; category: string };
export type SeedPlot = { name: string; kind: PlotKind };

export type FarmLocation = {
  lat: number;
  lng: number;
  village: string;
  address: string;
  timezone: string;
};

export type FarmProfile = {
  id: string;
  name: string;
  shortName: string;
  legalName: string | null;
  timezone: string;
  currency: string;
  units: "metric" | "imperial";
  languages: string[];
  location: FarmLocation;
  acres: number | null;
  treeCensusTarget: number | null;
  animalCensusTarget: number | null;
  bedCensusTarget: number | null;
  enabledPacks: PackId[];
  publicSite: boolean;
  biomeId: string;
  harvestCrops: string[];
  harvestDestinations: string[];
  seedSpecies: SeedSpecies[];
  seedPlots: SeedPlot[];
  zoneLabels: string[];
  kitItems: string[];
  kitStatuses: string[];
  activityTypes: string[];
  ledgerCategories: string[];
  pondLevels: string[];
  defaultAnimalKind: string;
  rules: FarmRule[];
  onboardedAt: string | null;
};

export type RuntimeFarm = FarmProfile & {
  domains: DomainDef[];
  domainBySlug: Partial<Record<ObservationDomain, DomainDef>>;
  modules: AdminModule[];
  assets: AssetKind[];
  mapPrimary: MapPrimary;
  farmCoords: { lat: number; lng: number };
};
