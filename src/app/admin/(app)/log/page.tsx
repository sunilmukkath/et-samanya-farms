import { CaptureSheet } from "@/components/admin/CaptureSheet";
import { LogHistory } from "@/components/admin/LogHistory";
import { LogNav } from "@/components/admin/LogNav";
import { listAnimals, listObservations, listPlantStands, listPlots } from "@/db/queries";
import { captureRuntimeFrom } from "@/lib/capture";
import { isObservationDomain, isVisionConfigured } from "@/lib/farm";
import { defaultDomainForGroup, groupForDomain, isCaptureGroupId } from "@/lib/packs/groups";
import { phiHolds } from "@/lib/phi";
import { getRuntimeFarm } from "@/lib/profile";
import { onFarmWater } from "@/lib/water";
import { getFarmWeather, todayRainMm } from "@/lib/weather";

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    group?: string;
    view?: string;
    treeId?: string;
    source?: string;
    plantStandId?: string;
  }>;
}) {
  const params = await searchParams;
  const runtime = await getRuntimeFarm();
  const hasDomainParam = Boolean(params.domain);
  const requested = params.domain ?? "";
  const domainFromUrl =
    isObservationDomain(requested) && runtime.domains.some((item) => item.slug === requested) ? requested : null;
  const requestedGroup = params.group ?? "";
  const group = isCaptureGroupId(requestedGroup)
    ? requestedGroup
    : domainFromUrl
      ? groupForDomain(domainFromUrl)
      : "note";
  const domain =
    domainFromUrl ??
    defaultDomainForGroup(group, runtime.domains) ??
    runtime.domains[0]?.slug ??
    "rain";
  const view = params.view === "past" ? "past" : "new";
  const [weather, plots, animals, plantStands, healthRows, waterRows, history] = await Promise.all([
    getFarmWeather(),
    listPlots(),
    listAnimals(),
    listPlantStands(),
    domain === "harvest" ? listObservations({ domain: "plant_health", limit: 40 }) : Promise.resolve([]),
    domain === "rain" ? listObservations({ limit: 80 }) : Promise.resolve([]),
    view === "past"
      ? listObservations(group === "note" ? { limit: 40 } : { domain, limit: 60 })
      : Promise.resolve([]),
  ]);
  const holds = phiHolds(healthRows);
  const phiWarning =
    domain === "harvest" && holds.length
      ? holds.map((hold) => `Wait to pick ${hold.crop} until ${hold.until}${hold.product ? ` (${hold.product})` : ""}`).join(". ")
      : null;
  const water = onFarmWater(waterRows);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <LogNav
        currentDomain={domain}
        currentGroup={group}
        view={view}
        domains={runtime.domains}
        hasDomainParam={hasDomainParam}
      />
      {view === "new" ? (
        <div className="mt-5">
          {domain === "rain" ? (
            <p className="mb-4 text-sm text-ink-soft">
              {water.gaugeMm != null
                ? `Last gauge ${water.gaugeMm} mm. Pond and pump sit under More water.`
                : "Log the gauge first. Pond, pump, and tank sit under More water."}
            </p>
          ) : null}
          <CaptureSheet
            key={`${group}:${domain}`}
            domain={domain}
            treeId={params.treeId}
            plantStandId={params.plantStandId}
            rainHintMm={todayRainMm(weather)}
            plots={plots}
            animals={animals}
            plantStands={plantStands}
            visionEnabled={isVisionConfigured()}
            source={params.source}
            runtime={captureRuntimeFrom(runtime)}
            phiWarning={phiWarning}
            mode={group === "note" ? "note" : "full"}
            group={group}
          />
        </div>
      ) : (
        <LogHistory
          rows={history}
          domain={group === "note" ? undefined : domain}
          farmName={runtime.shortName}
          mixed={group === "note"}
        />
      )}
    </div>
  );
}
