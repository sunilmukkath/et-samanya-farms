import { catalogDomains } from "@/lib/packs/domains";
import { packById } from "@/lib/packs/catalog";
import type {
  AdminModule,
  AssetKind,
  DomainDef,
  FarmProfile,
  MapPrimary,
  PackId,
  RuntimeFarm,
} from "@/lib/packs/types";
import type { ObservationDomain } from "@/db/schema";

const moduleOrder: AdminModule[] = [
  "map",
  "trees",
  "plots",
  "stands",
  "animals",
  "water",
  "nodes",
  "stay",
  "brief",
  "tasks",
  "season",
  "ledger",
];

const mapPriority: MapPrimary[] = ["trees", "plots", "animals", "nodes"];

export function resolveFarm(profile: FarmProfile): RuntimeFarm {
  const packs = profile.enabledPacks
    .map((id) => packById[id])
    .filter((pack): pack is NonNullable<typeof pack> => Boolean(pack));

  const domainSlugs = new Set<ObservationDomain>();
  const modules = new Set<AdminModule>(["map", "brief", "tasks"]);
  const assets = new Set<AssetKind>();
  let mapPrimary: MapPrimary = "plots";

  for (const pack of packs) {
    for (const slug of pack.domains) domainSlugs.add(slug);
    for (const mod of pack.modules) modules.add(mod);
    for (const asset of pack.assets) assets.add(asset);
  }

  const enabled = packs.filter((pack) => !pack.overlay);
  const chosen = enabled.find((pack) => pack.mapPrimary === "trees")
    ?? enabled[0]
    ?? packs[0];
  if (chosen) mapPrimary = chosen.mapPrimary;
  for (const primary of mapPriority) {
    if (enabled.some((pack) => pack.mapPrimary === primary) && primary === "trees") {
      mapPrimary = "trees";
      break;
    }
  }

  if (profile.treeCensusTarget) modules.add("trees");
  modules.add("season");

  const domains = catalogDomains.filter((domain) => domainSlugs.has(domain.slug));
  const domainBySlug = Object.fromEntries(domains.map((domain) => [domain.slug, domain])) as RuntimeFarm["domainBySlug"];

  return {
    ...profile,
    domains,
    domainBySlug,
    modules: moduleOrder.filter((mod) => modules.has(mod)),
    assets: [...assets],
    mapPrimary,
    farmCoords: { lat: profile.location.lat, lng: profile.location.lng },
  };
}

export function isPackId(value: string): value is PackId {
  return value in packById;
}

export function domainFields(runtime: RuntimeFarm, slug: ObservationDomain): DomainDef["fields"] {
  return runtime.domainBySlug[slug]?.fields ?? [];
}
