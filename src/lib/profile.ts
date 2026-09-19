import { seedFarmProfile } from "@/lib/farm.config";
import { resolveFarm } from "@/lib/packs/resolve";
import type { FarmProfile, RuntimeFarm } from "@/lib/packs/types";
import { samanyaProfile } from "@/lib/profiles/samanya";

type ProfileStore = {
  getFarmProfileRecord: () => Promise<FarmProfile | null>;
};

let store: ProfileStore | null = null;
let cache: { at: number; value: FarmProfile } | null = null;
const TTL_MS = 8_000;

export function bindProfileStore(next: ProfileStore) {
  store = next;
}

export function clearFarmProfileCache() {
  cache = null;
}

export async function getFarmProfile(): Promise<FarmProfile> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let stored: FarmProfile | null = null;
  try {
    if (!store) {
      const queries = await import("@/db/queries");
      stored = await queries.getFarmProfileRecord();
    } else {
      stored = await store.getFarmProfileRecord();
    }
  } catch {
    stored = null;
  }
  const value = normalizeProfile(stored ?? seedFarmProfile());
  cache = { at: Date.now(), value };
  return value;
}

function normalizeProfile(value: FarmProfile): FarmProfile {
  return {
    ...value,
    units: value.units === "imperial" ? "imperial" : "metric",
    animalCensusTarget: value.animalCensusTarget ?? null,
    bedCensusTarget: value.bedCensusTarget ?? null,
    treeCensusTarget: value.treeCensusTarget ?? null,
  };
}

export async function getRuntimeFarm(): Promise<RuntimeFarm> {
  return resolveFarm(await getFarmProfile());
}

export { samanyaProfile };
