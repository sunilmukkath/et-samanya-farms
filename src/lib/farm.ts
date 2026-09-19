import { resolveFarm } from "@/lib/packs/resolve";
import { catalogDomains } from "@/lib/packs/domains";
import type { FarmProfile, RuntimeFarm } from "@/lib/packs/types";
import { samanyaProfile } from "@/lib/profiles/samanya";
import type { ObservationDomain } from "@/db/schema";

const defaults = resolveFarm(samanyaProfile);

export const farmCoords = defaults.farmCoords;
export const treeCensusTarget = defaults.treeCensusTarget ?? 0;
export const domains = defaults.domains;
export const domainBySlug = Object.fromEntries(catalogDomains.map((d) => [d.slug, d])) as Record<
  ObservationDomain,
  (typeof catalogDomains)[number]
>;
export const zoneLabels = defaults.zoneLabels;
export const seedSpecies = defaults.seedSpecies;
export const seedPlots = defaults.seedPlots;
export const harvestCrops = defaults.harvestCrops;
export const harvestDestinations = defaults.harvestDestinations;
export const activityTypes = defaults.activityTypes;
export const kitItems = defaults.kitItems;
export const kitStatuses = defaults.kitStatuses;
export const ledgerCategories = defaults.ledgerCategories;
export const pondLevels = defaults.pondLevels;

export const healthOptions = [
  { value: "healthy" as const, label: "Healthy" },
  { value: "watch" as const, label: "Watch" },
  { value: "stressed" as const, label: "Stressed" },
  { value: "dead" as const, label: "Dead" },
];

export const habitOptions = [
  { value: "sapling" as const, label: "Sapling" },
  { value: "young" as const, label: "Young" },
  { value: "mature" as const, label: "Mature" },
];

export const plotKindOptions = [
  { value: "horticulture" as const, label: "Horticulture" },
  { value: "solo" as const, label: "Solo crop" },
  { value: "animal" as const, label: "Animal yard" },
  { value: "pond" as const, label: "Pond" },
  { value: "trees" as const, label: "Tree belt" },
  { value: "other" as const, label: "Other" },
];

export const DUPLICATE_TREE_METERS = 4;

export function isObservationDomain(value: string): value is ObservationDomain {
  return catalogDomains.some((d) => d.slug === value);
}

export function treeAgeLabel(plantingYear?: number | null, plantedOn?: Date | string | null) {
  const start = plantedOn
    ? new Date(plantedOn)
    : plantingYear
      ? new Date(plantingYear, 0, 1)
      : null;
  if (!start || Number.isNaN(start.getTime())) return "Age unknown";
  const months = Math.max(
    0,
    (new Date().getFullYear() - start.getFullYear()) * 12 + (new Date().getMonth() - start.getMonth()),
  );
  if (months < 1) return "This month";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (!rem) return `${years} yr`;
  return `${years}y ${rem}mo`;
}

export function isVisionConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isPublicHarvestEnabled() {
  return process.env.PUBLIC_HARVEST_FROM_LOG !== "0";
}

export function droneTileUrl() {
  return process.env.FARM_DRONE_TILE_URL?.trim() || null;
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "Never";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Never";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function runtimeHasModule(runtime: RuntimeFarm, module: RuntimeFarm["modules"][number]) {
  return runtime.modules.includes(module);
}

export type { FarmProfile, RuntimeFarm };
