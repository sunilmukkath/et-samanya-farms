import type { FarmRule, SeedPlot, SeedSpecies } from "@/lib/packs/types";

export type BiomeCatalog = {
  id: string;
  label: string;
  harvestCrops: string[];
  seedSpecies: SeedSpecies[];
  seedPlots: SeedPlot[];
  zoneLabels: string[];
  kitItems: string[];
  defaultAnimalKind: string;
  rules: FarmRule[];
};

export const tamilNaduAgroforestry: BiomeCatalog = {
  id: "tamil-nadu-agroforestry",
  label: "Tamil Nadu agroforestry",
  harvestCrops: [
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
  ],
  seedSpecies: [
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
  ],
  seedPlots: [
    { name: "Horticulture beds", kind: "horticulture" },
    { name: "Solo crop", kind: "solo" },
    { name: "Animal yard", kind: "animal" },
    { name: "Sensei pond", kind: "pond" },
    { name: "North tree belt", kind: "trees" },
    { name: "South tree belt", kind: "trees" },
  ],
  zoneLabels: ["Trees", "Solo crops", "Walk-paths & open ground", "Pond", "Animal husbandry", "Horticulture", "House, store, tank"],
  kitItems: ["Solar pump", "Drip", "Tank", "Tool", "Other"],
  defaultAnimalKind: "Cattle",
  rules: [
    {
      id: "pond-low",
      title: "Pond is low",
      enabled: true,
      when: { metric: "pond.level_m", op: "lt", value: 0.4, durationMin: 20 },
      then: { task: "Check pond and canals", domain: "rain", alert: "Pond below 0.4 m" },
    },
    {
      id: "soil-dry",
      title: "Beds are dry",
      enabled: true,
      when: { deviceKind: "soil", metric: "soil.moisture_pct", op: "lt", value: 18, durationMin: 30 },
      then: { task: "Walk horticulture beds — soil is dry", domain: "soil", alert: "Soil moisture low" },
    },
    {
      id: "node-silent",
      title: "A node went quiet",
      enabled: true,
      when: { op: "silent", durationMin: 120 },
      then: { task: "Check a silent node", domain: "kit", alert: "Node heartbeat missing" },
    },
  ],
};

export const temperateOrchard: BiomeCatalog = {
  id: "temperate-orchard",
  label: "Temperate orchard",
  harvestCrops: ["Apple", "Pear", "Stone fruit", "Berries", "Grapes", "Other"],
  seedSpecies: [
    { name: "Apple", tamil: "", category: "fruit" },
    { name: "Pear", tamil: "", category: "fruit" },
    { name: "Peach", tamil: "", category: "fruit" },
    { name: "Plum", tamil: "", category: "fruit" },
    { name: "Cherry", tamil: "", category: "fruit" },
    { name: "Walnut", tamil: "", category: "food" },
  ],
  seedPlots: [
    { name: "Orchard block A", kind: "trees" },
    { name: "Orchard block B", kind: "trees" },
    { name: "Understory beds", kind: "horticulture" },
    { name: "Pond", kind: "pond" },
  ],
  zoneLabels: ["House", "Orchard", "Understory", "Water", "Edges"],
  kitItems: ["Pump", "Drip", "Frost fan", "Tool", "Other"],
  defaultAnimalKind: "Sheep",
  rules: [
    {
      id: "soil-dry",
      title: "Orchard soil is dry",
      enabled: true,
      when: { deviceKind: "soil", metric: "soil.moisture_pct", op: "lt", value: 20, durationMin: 30 },
      then: { task: "Check drip in the orchard", domain: "kit" },
    },
    {
      id: "node-silent",
      title: "A node went quiet",
      enabled: true,
      when: { op: "silent", durationMin: 120 },
      then: { task: "Check a silent node", domain: "kit" },
    },
  ],
};

export const vegetablesOnly: BiomeCatalog = {
  id: "vegetables-only",
  label: "Vegetables / market garden",
  harvestCrops: ["Leafy greens", "Tomato", "Cucumber", "Root crops", "Beans", "Herbs", "Other"],
  seedSpecies: [
    { name: "Neem", tamil: "வேம்பு", category: "medicinal" },
    { name: "Moringa", tamil: "முருங்கை", category: "food" },
    { name: "Banana", tamil: "வாழை", category: "fruit" },
  ],
  seedPlots: [
    { name: "Bed row 1", kind: "horticulture" },
    { name: "Bed row 2", kind: "horticulture" },
    { name: "Nursery", kind: "horticulture" },
    { name: "Compost", kind: "other" },
    { name: "Tank", kind: "pond" },
  ],
  zoneLabels: ["House", "Beds", "Nursery", "Compost", "Paths"],
  kitItems: ["Pump", "Drip", "Tank", "Tool", "Other"],
  defaultAnimalKind: "Chicken",
  rules: [
    {
      id: "soil-dry",
      title: "Beds are dry",
      enabled: true,
      when: { deviceKind: "soil", metric: "soil.moisture_pct", op: "lt", value: 22, durationMin: 20 },
      then: { task: "Irrigate dry beds", domain: "soil" },
    },
    {
      id: "node-silent",
      title: "A node went quiet",
      enabled: true,
      when: { op: "silent", durationMin: 90 },
      then: { task: "Check a silent node", domain: "kit" },
    },
  ],
};

export const biomes = [tamilNaduAgroforestry, temperateOrchard, vegetablesOnly];

export function biomeById(id: string) {
  return biomes.find((biome) => biome.id === id) ?? tamilNaduAgroforestry;
}
