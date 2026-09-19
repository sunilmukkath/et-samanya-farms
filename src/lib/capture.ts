import type { ObservationDetails } from "@/db/schema";
import type { CaptureField, RuntimeFarm } from "@/lib/packs/types";
import { healthOptions } from "@/lib/farm";
import type { AnimalRow, PlantStandRow } from "@/db/schema";

export function resolveFieldOptions(
  field: CaptureField,
  runtime: RuntimeFarm,
  extras: {
    animals?: Pick<AnimalRow, "id" | "name" | "species">[];
    plantStands?: Pick<PlantStandRow, "id" | "name" | "crop">[];
  } = {},
): { options: string[]; values?: string[] } {
  if (field.options) return { options: field.options, values: field.values };
  switch (field.optionsFrom) {
    case "harvestCrops":
      return { options: runtime.harvestCrops };
    case "harvestDestinations":
      return { options: runtime.harvestDestinations };
    case "kitItems":
      return { options: runtime.kitItems };
    case "kitStatuses":
      return { options: runtime.kitStatuses };
    case "activityTypes":
      return { options: runtime.activityTypes };
    case "pondLevels":
      return { options: runtime.pondLevels };
    case "health":
      return { options: healthOptions.map((o) => o.label), values: healthOptions.map((o) => o.value) };
    case "cropsAndTree":
      return { options: [...runtime.harvestCrops, "Tree"] };
    case "animals": {
      const animals = extras.animals ?? [];
      if (!animals.length) return { options: [] };
      return {
        options: ["Herd note", ...animals.map((animal) => `${animal.name} (${animal.species})`)],
        values: ["", ...animals.map((animal) => animal.id)],
      };
    }
    case "plantStands": {
      const stands = extras.plantStands ?? [];
      if (!stands.length) return { options: [] };
      return {
        options: ["No bed", ...stands.map((stand) => `${stand.name} · ${stand.crop}`)],
        values: ["", ...stands.map((stand) => stand.id)],
      };
    }
    default:
      return { options: field.options ?? [] };
  }
}

export function detailsFromFields(fields: CaptureField[], form: FormData): ObservationDetails {
  const details: ObservationDetails = {};
  for (const field of fields) {
    const raw = form.get(field.name);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;
    if (field.name === "animalId" || field.name === "plantStandId") {
      if (field.name === "plantStandId") details.plantStandId = value;
      continue;
    }
    if (field.type === "number") {
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      (details as Record<string, unknown>)[field.name] = n;
      continue;
    }
    if (field.storeAs === "boolean") {
      if (value === "On" || value === "true") (details as Record<string, unknown>)[field.name] = true;
      if (value === "Off" || value === "false") (details as Record<string, unknown>)[field.name] = false;
      continue;
    }
    (details as Record<string, unknown>)[field.name] = value;
  }
  return details;
}

export function captureRuntimeFrom(runtime: RuntimeFarm) {
  return {
    domains: runtime.domains,
    harvestCrops: runtime.harvestCrops,
    harvestDestinations: runtime.harvestDestinations,
    kitItems: runtime.kitItems,
    kitStatuses: runtime.kitStatuses,
    activityTypes: runtime.activityTypes,
    pondLevels: runtime.pondLevels,
    defaultAnimalKind: runtime.defaultAnimalKind,
  };
}
