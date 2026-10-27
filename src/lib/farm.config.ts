import type { FarmProfile } from "@/lib/packs/types";
import { blankFarmProfile, samanyaProfile } from "@/lib/profiles/samanya";

/**
 * This app is ET Samanya. An empty database opens that farm, already named.
 * Set FARM_SEED=blank when a different farm should start from the setup screen.
 */
export function seedFarmProfile(): FarmProfile {
  const seed = (process.env.FARM_SEED ?? "").trim().toLowerCase();
  if (seed === "blank" || seed === "empty" || seed === "none") return blankFarmProfile();
  if (seed === "" || seed === "samanya") return structuredClone(samanyaProfile);
  return blankFarmProfile();
}
