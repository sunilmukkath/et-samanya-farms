import { listObservations, listZones, canPersistFarmData } from "@/db/queries";
import { censusTotals, sectionCensus, type SectionCensus } from "@/lib/census";
import { getRuntimeFarm } from "@/lib/profile";

export type FieldStartStep = "fence" | "count" | "ready";

export type FieldStart = {
  step: FieldStartStep;
  fence: boolean;
  sections: SectionCensus[];
  trees: number;
  plants: number;
  acres: number | null;
  onboarded: boolean;
};

export async function loadFieldStart(): Promise<FieldStart> {
  const runtime = await getRuntimeFarm();
  const persist = canPersistFarmData();
  const zones = persist ? await listZones().catch(() => []) : [];
  const rows = persist ? await listObservations({ domain: "trees", limit: 200 }).catch(() => []) : [];
  const fence = zones.some((zone) => zone.name === "Farm boundary" && zone.polygon);
  const sections = sectionCensus(rows);
  const totals = censusTotals(sections);
  const step: FieldStartStep = !fence ? "fence" : runtime.censusDoneAt ? "ready" : "count";
  return {
    step,
    fence,
    sections,
    trees: totals.trees,
    plants: totals.plants,
    acres: runtime.acres,
    onboarded: Boolean(runtime.onboardedAt),
  };
}

/** Where to send someone who opens a page before the fence and the tree count are done. */
export function fieldStartRedirect(start: FieldStart, pathWithSearch: string): string | null {
  if (start.step === "ready") return null;
  const q = pathWithSearch.indexOf("?");
  const path = q === -1 ? pathWithSearch : pathWithSearch.slice(0, q);
  const params = new URLSearchParams(q === -1 ? "" : pathWithSearch.slice(q + 1));
  if (!start.onboarded && path.startsWith("/admin/setup")) return null;
  if (path === "/admin") return null;
  if (path === "/admin/map") {
    if (start.step === "fence" && params.get("walk") !== "fence") return "/admin/map?walk=fence";
    return null;
  }
  return "/admin";
}
