import type { DomainDef } from "@/lib/packs/types";

export const catalogDomains: DomainDef[] = [
  {
    slug: "trees",
    label: "Trees",
    tamil: "மரம்",
    hint: "Plant, prune, water, census",
    visionPack: "tree",
    fields: [
      { name: "action", label: "Action", type: "chips", options: ["Noted", "Watered", "Pruned", "Planted", "Replaced"] },
    ],
  },
  {
    slug: "plants",
    label: "Plants",
    tamil: "செடி",
    hint: "Beds, stage, what is coming up",
    visionPack: "tree",
    fields: [
      { name: "plantStandId", label: "Bed", type: "select", optionsFrom: "plantStands" },
      { name: "crop", label: "Crop", type: "select", optionsFrom: "harvestCrops" },
      {
        name: "stage",
        label: "Stage",
        type: "chips",
        options: ["Seedling", "Growing", "Flowering", "Harvest"],
      },
    ],
  },
  {
    slug: "soil",
    label: "Soil",
    tamil: "மண்",
    hint: "Compost, mulch, moisture",
    visionPack: "compost",
    fields: [
      { name: "moisture", label: "Moisture", type: "chips", options: ["Dry", "Ok", "Wet"] },
      {
        name: "action",
        label: "Action",
        type: "chips",
        options: ["Noted", "Compost", "Mulch", "Vermiculture", "Test"],
      },
    ],
  },
  {
    slug: "rain",
    label: "Rain & water",
    tamil: "மழை",
    hint: "Rain, pond, drip, solar pump",
    fields: [
      { name: "rainMm", label: "Rain mm", type: "number", step: "0.1", inputMode: "decimal", hintFrom: "rainMm", placeholder: "Gauge, not the sky model" },
      { name: "pondLevel", label: "Pond", type: "chips", optionsFrom: "pondLevels" },
      { name: "irrigationMinutes", label: "Irrigation min", type: "number", inputMode: "numeric" },
      {
        name: "pumpOn",
        label: "Solar pump",
        type: "chips",
        options: ["—", "On", "Off"],
        values: ["", "On", "Off"],
        storeAs: "boolean",
      },
      {
        name: "tankLevel",
        label: "Tank",
        type: "chips",
        options: ["—", "Low", "Ok", "High"],
        values: ["", "Low", "Ok", "High"],
      },
      { name: "canalNote", label: "Canal / swale", type: "text", placeholder: "Flow, silt, gate" },
    ],
  },
  {
    slug: "harvest",
    label: "Harvest",
    tamil: "அறுவடை",
    hint: "What came off the land",
    fields: [
      { name: "crop", label: "Crop", type: "select", optionsFrom: "harvestCrops" },
      { name: "quantity", label: "Qty", type: "number", step: "0.1", inputMode: "decimal" },
      { name: "unit", label: "Unit", type: "chips", options: ["kg", "bundle", "crate", "count"] },
      { name: "destination", label: "Went to", type: "chips", optionsFrom: "harvestDestinations" },
    ],
  },
  {
    slug: "animals",
    label: "Animals",
    tamil: "கால்நடை",
    hint: "Cattle, feed, manure",
    visionPack: "cattle",
    fields: [
      { name: "animalId", label: "Herd", type: "select", optionsFrom: "animals" },
      { name: "animalKind", label: "Kind", type: "text", defaultValue: "Cattle" },
      { name: "animalCount", label: "Count", type: "number", inputMode: "numeric" },
      {
        name: "animalCondition",
        label: "Condition",
        type: "chips",
        options: ["Healthy", "Watch", "Stressed"],
      },
      { name: "feedKg", label: "Feed kg", type: "number", step: "0.1", inputMode: "decimal" },
    ],
  },
  {
    slug: "plant_health",
    label: "Plant health",
    tamil: "நலம்",
    hint: "Pests, spray, when it is safe to pick",
    photoDefault: true,
    visionPack: "plant_health",
    fields: [
      { name: "crop", label: "Crop / tree", type: "select", optionsFrom: "cropsAndTree" },
      { name: "severity", label: "Health", type: "chips", optionsFrom: "health" },
      {
        name: "action",
        label: "What we did",
        type: "chips",
        options: ["Noted", "Sprayed", "Neem", "Trap", "Hand pick"],
      },
      {
        name: "sprayProduct",
        label: "Applied",
        type: "text",
        placeholder: "Neem, soap, name of spray",
        colSpan: 2,
      },
      {
        name: "phiDays",
        label: "Wait days",
        type: "number",
        inputMode: "numeric",
        placeholder: "Days until safe to pick",
      },
    ],
  },
  {
    slug: "stay",
    label: "Farm stay",
    tamil: "தங்கல்",
    hint: "Guests and occupancy",
    fields: [
      { name: "guestCount", label: "Guests", type: "number", inputMode: "numeric", colSpan: 2 },
      { name: "stayFrom", label: "From", type: "date" },
      { name: "stayTo", label: "To", type: "date" },
    ],
  },
  {
    slug: "activity",
    label: "Activities",
    tamil: "நிகழ்வு",
    hint: "Walks, workshops, labour on the land",
    fields: [
      { name: "activityType", label: "Type", type: "chips", optionsFrom: "activityTypes" },
      { name: "attendees", label: "People", type: "number", inputMode: "numeric" },
      { name: "hours", label: "Hours", type: "number", step: "0.5", inputMode: "decimal" },
      { name: "who", label: "Who", type: "text", placeholder: "Operator or village help" },
    ],
  },
  {
    slug: "kit",
    label: "Kit & energy",
    tamil: "கருவி",
    hint: "Solar pump, drip, tools",
    fields: [
      { name: "kitItem", label: "Kit", type: "chips", optionsFrom: "kitItems" },
      { name: "kitStatus", label: "Status", type: "chips", optionsFrom: "kitStatuses" },
      { name: "hours", label: "Runtime hr", type: "number", step: "0.1", inputMode: "decimal" },
      { name: "irrigationMinutes", label: "Drip min", type: "number", inputMode: "numeric" },
    ],
  },
];

export const domainCatalogBySlug = Object.fromEntries(catalogDomains.map((d) => [d.slug, d])) as Record<
  DomainDef["slug"],
  DomainDef
>;
