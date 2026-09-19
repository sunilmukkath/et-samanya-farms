import { CaptureSheet, DomainPicker } from "@/components/admin/CaptureSheet";
import { OnFarmWater } from "@/components/admin/OnFarmWater";
import { listAnimals, listObservations, listPlantStands, listPlots } from "@/db/queries";
import { captureRuntimeFrom } from "@/lib/capture";
import { isObservationDomain, isVisionConfigured } from "@/lib/farm";
import { phiHolds } from "@/lib/phi";
import { getRuntimeFarm } from "@/lib/profile";
import { onFarmWater, waterHasValue } from "@/lib/water";
import { getFarmWeather } from "@/lib/weather";

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; treeId?: string; source?: string; plantStandId?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getRuntimeFarm();
  const requested = params.domain ?? "";
  const domain = isObservationDomain(requested) && runtime.domains.some((item) => item.slug === requested)
    ? requested
    : (runtime.domains[0]?.slug ?? "rain");
  const [weather, plots, animals, plantStands, healthRows, waterRows] = await Promise.all([
    getFarmWeather(),
    listPlots(),
    listAnimals(),
    listPlantStands(),
    domain === "harvest" ? listObservations({ domain: "plant_health", limit: 40 }) : Promise.resolve([]),
    domain === "rain" || domain === "kit" ? listObservations({ limit: 80 }) : Promise.resolve([]),
  ]);
  const holds = phiHolds(healthRows);
  const phiWarning =
    domain === "harvest" && holds.length
      ? holds.map((hold) => `Wait to pick ${hold.crop} until ${hold.until}${hold.product ? ` (${hold.product})` : ""}`).join(". ")
      : null;
  const water = onFarmWater(waterRows);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <DomainPicker current={domain} domains={runtime.domains} />
      {domain === "rain" || domain === "kit" ? (
        waterHasValue(water) ? <OnFarmWater water={water} /> : null
      ) : null}
      <div className="mt-5">
        <CaptureSheet
          domain={domain}
          treeId={params.treeId}
          plantStandId={params.plantStandId}
          rainHintMm={weather?.week?.[0]?.rainMm ?? weather?.rainMm}
          plots={plots}
          animals={animals}
          plantStands={plantStands}
          visionEnabled={isVisionConfigured()}
          source={params.source}
          runtime={captureRuntimeFrom(runtime)}
          phiWarning={phiWarning}
        />
      </div>
    </div>
  );
}
