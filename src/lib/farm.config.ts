import type { FarmProfile } from "@/lib/packs/types";
import { blankFarmProfile, samanyaProfile } from "@/lib/profiles/samanya";

/** Local / env seed. Other farms set FARM_SEED=blank and never inherit Thenkulapakkam. */
export function seedFarmProfile(): FarmProfile {
  const seed = (process.env.FARM_SEED ?? "").trim().toLowerCase();
  if (seed === "samanya") return structuredClone(samanyaProfile);
  return blankFarmProfile();
}
