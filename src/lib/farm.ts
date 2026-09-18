import { landUnits, site } from "@/lib/site";
import type {
  ObservationDomain,
  PlotKind,
  TreeHabit,
  TreeHealth,
} from "@/db/schema";

export const farmCoords = {
  lat: site.location.lat,
  lng: site.location.lng,
} as const;

export const treeCensusTarget = site.treesPlanted;

export const domains: {
  slug: ObservationDomain;
  label: string;
  tamil: string;
  hint: string;
  photoDefault?: boolean;
}[] = [
  { slug: "trees", label: "Trees", tamil: "மரம்", hint: "Plant, prune, water, census" },
  { slug: "plants", label: "Plants", tamil: "செடி", hint: "Beds, stage, what is coming up" },
  { slug: "soil", label: "Soil", tamil: "மண்", hint: "Compost, mulch, moisture" },
  { slug: "rain", label: "Rain & water", tamil: "மழை", hint: "Rain, pond, drip, solar pump" },
  { slug: "harvest", label: "Harvest", tamil: "அறுவடை", hint: "What came off the land" },
  { slug: "animals", label: "Animals", tamil: "கால்நடை", hint: "Cattle, feed, manure" },
  { slug: "plant_health", label: "Plant health", tamil: "நலம்", hint: "Pests, stress, recovery", photoDefault: true },
  { slug: "stay", label: "Farm stay", tamil: "தங்கல்", hint: "Guests and occupancy" },
  { slug: "activity", label: "Activities", tamil: "நிகழ்வு", hint: "Walks, workshops, labour on the land" },
  { slug: "kit", label: "Kit & energy", tamil: "கருவி", hint: "Solar pump, drip, tools" },
];

export const domainBySlug = Object.fromEntries(domains.map((d) => [d.slug, d])) as Record<
  ObservationDomain,
  (typeof domains)[number]
>;

export const healthOptions: { value: TreeHealth; label: string }[] = [
  { value: "healthy", label: "Healthy" },
  { value: "watch", label: "Watch" },
  { value: "stressed", label: "Stressed" },
  { value: "dead", label: "Dead" },
];

export const habitOptions: { value: TreeHabit; label: string }[] = [
  { value: "sapling", label: "Sapling" },
  { value: "young", label: "Young" },
  { value: "mature", label: "Mature" },
];

export const zoneLabels = landUnits.map((u) => u.label);

export const seedSpecies: { name: string; tamil: string; category: string }[] = [
  { name: "Mango", tamil: "மா", category: "fruit" },
  { name: "Palmyra", tamil: "பனை", category: "palm" },
  { name: "Arecanut", tamil: "பாக்கு", category: "palm" },
  { name: "Coconut", tamil: "தேங்காய்", category: "palm" },
  { name: "Jackfruit", tamil: "பலா", category: "fruit" },
  { name: "Guava", tamil: "கொய்யா", category: "fruit" },
  { name: "Banana", tamil: "வாழை", category: "fruit" },
  { name: "Tamarind", tamil: "புளி", category: "fruit" },
  { name: "Amla", tamil: "நெல்லி", category: "fruit" },
  { name: "Moringa", tamil: "முருங்கை", category: "food" },
  { name: "Neem", tamil: "வேம்பு", category: "medicinal" },
  { name: "Teak", tamil: "தேக்கு", category: "timber" },
  { name: "Pongamia", tamil: "புங்கை", category: "timber" },
  { name: "Jamun", tamil: "நாவல்", category: "fruit" },
  { name: "Lime", tamil: "எலுமிச்சை", category: "fruit" },
  { name: "Curry leaf", tamil: "கறிவேப்பிலை", category: "food" },
  { name: "Cashew", tamil: "முந்திரி", category: "fruit" },
];

export const harvestCrops = [
  "Vegetables",
  "Spinach",
  "Keerai",
  "Sesame",
  "Urad dal",
  "Gourd",
  "Watermelon",
  "Passion fruit",
  "Fruit",
  "Other",
];

export const activityTypes = ["Walk", "Workshop", "Picnic", "Stay day", "Labour", "Other"];

export const plotKindOptions: { value: PlotKind; label: string }[] = [
  { value: "horticulture", label: "Horticulture" },
  { value: "solo", label: "Solo crop" },
  { value: "animal", label: "Animal yard" },
  { value: "pond", label: "Pond" },
  { value: "trees", label: "Tree belt" },
  { value: "other", label: "Other" },
];

export const seedPlots: { name: string; kind: PlotKind }[] = [
  { name: "Horticulture beds", kind: "horticulture" },
  { name: "Solo crop", kind: "solo" },
  { name: "Animal yard", kind: "animal" },
  { name: "Sensei pond", kind: "pond" },
  { name: "North tree belt", kind: "trees" },
  { name: "South tree belt", kind: "trees" },
];

export const harvestDestinations = ["House", "Gift", "Sale"];

export const pondLevels = ["Low", "Ok", "High"];

export const kitItems = ["Solar pump", "Drip", "Tank", "Tool", "Other"];

export const kitStatuses = ["On", "Off", "Fault", "Borrowed", "Fixed"];

export const ledgerCategories = ["Seed", "Labour", "Diesel", "Feed", "Kit", "Produce sold", "Other"];

export const DUPLICATE_TREE_METERS = 4;

export function isObservationDomain(value: string): value is ObservationDomain {
  return domains.some((d) => d.slug === value);
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
