import type { ObservationDomain } from "@/db/schema";
import type { DomainDef } from "@/lib/packs/types";

export const captureGroupIds = ["note", "water", "crop", "more"] as const;
export type CaptureGroupId = (typeof captureGroupIds)[number];

export const waterDomains: ObservationDomain[] = ["rain"];
export const cropDomains: ObservationDomain[] = ["plants", "plant_health", "harvest"];
export const moreDomains: ObservationDomain[] = ["trees", "soil", "animals", "stay", "kit", "activity"];

export function isCaptureGroupId(value: string): value is CaptureGroupId {
  return (captureGroupIds as readonly string[]).includes(value);
}

export function groupForDomain(domain: ObservationDomain): CaptureGroupId {
  if (waterDomains.includes(domain)) return "water";
  if (cropDomains.includes(domain)) return "crop";
  return "more";
}

export function defaultDomainForGroup(
  group: CaptureGroupId,
  enabled: DomainDef[],
  lastDomain?: ObservationDomain | null,
): ObservationDomain | null {
  const slugs = new Set(enabled.map((item) => item.slug));
  if (group === "note") {
    if (lastDomain && slugs.has(lastDomain)) return lastDomain;
    if (slugs.has("activity")) return "activity";
    return enabled[0]?.slug ?? null;
  }
  const pool = group === "water" ? waterDomains : group === "crop" ? cropDomains : moreDomains;
  const available = pool.filter((slug) => slugs.has(slug));
  if (lastDomain && available.includes(lastDomain)) return lastDomain;
  return available[0] ?? null;
}

export function groupsFor(domains: DomainDef[]) {
  const slugs = new Set(domains.map((item) => item.slug));
  return [
    { id: "note" as const, label: "Note", domains: [] as ObservationDomain[] },
    { id: "water" as const, label: "Water", domains: waterDomains.filter((slug) => slugs.has(slug)) },
    { id: "crop" as const, label: "Crop", domains: cropDomains.filter((slug) => slugs.has(slug)) },
    { id: "more" as const, label: "More", domains: moreDomains.filter((slug) => slugs.has(slug)) },
  ].filter((group) => group.id === "note" || group.domains.length > 0);
}
