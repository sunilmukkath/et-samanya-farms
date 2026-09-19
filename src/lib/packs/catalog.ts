import type { PackId, PracticePack } from "@/lib/packs/types";

export const practicePacks: PracticePack[] = [
  {
    id: "agroforestry",
    label: "Agroforestry / trees",
    description: "Tree census, belts, and canopy health.",
    modules: ["map", "trees", "plots", "brief", "tasks", "season", "ledger"],
    domains: ["trees", "plant_health", "harvest", "activity"],
    assets: ["tree"],
    mapPrimary: "trees",
  },
  {
    id: "horticulture",
    label: "Horticulture",
    description: "Beds, crop cycles, harvest, and plant health.",
    modules: ["map", "plots", "stands", "brief", "tasks", "season", "ledger"],
    domains: ["plants", "harvest", "plant_health", "soil"],
    assets: ["bed"],
    mapPrimary: "plots",
  },
  {
    id: "livestock",
    label: "Livestock",
    description: "Herd registry, feed, and condition.",
    modules: ["animals", "tasks", "ledger"],
    domains: ["animals"],
    assets: ["animal"],
    mapPrimary: "animals",
  },
  {
    id: "water",
    label: "Water and soil",
    description: "Rain, pond, swales, compost, and moisture.",
    modules: ["water", "nodes", "season", "tasks"],
    domains: ["rain", "soil"],
    assets: ["pond"],
    mapPrimary: "nodes",
  },
  {
    id: "permaculture",
    label: "Permaculture overlay",
    description: "Zones 0–5 and stacking notes on top of other packs.",
    modules: ["map", "plots"],
    domains: [],
    assets: [],
    mapPrimary: "plots",
    overlay: true,
  },
  {
    id: "stay",
    label: "Stay / learning",
    description: "Guests, walks, and workshops.",
    modules: ["stay"],
    domains: ["stay", "activity"],
    assets: [],
    mapPrimary: "plots",
  },
  {
    id: "energy",
    label: "Energy / kit",
    description: "Pumps, drip, solar, and tools.",
    modules: ["nodes", "tasks"],
    domains: ["kit"],
    assets: [],
    mapPrimary: "nodes",
  },
];

export const packById = Object.fromEntries(practicePacks.map((pack) => [pack.id, pack])) as Record<
  PackId,
  PracticePack
>;
