import { CaptureSheet, DomainPicker } from "@/components/admin/CaptureSheet";
import { listAnimals, listPlots } from "@/db/queries";
import { isObservationDomain, isVisionConfigured } from "@/lib/farm";
import { getFarmWeather } from "@/lib/weather";

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; treeId?: string; source?: string }>;
}) {
  const params = await searchParams;
  const requested = params.domain ?? "";
  const domain = isObservationDomain(requested) ? requested : "rain";
  const [weather, plots, animals] = await Promise.all([getFarmWeather(), listPlots(), listAnimals()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <DomainPicker current={domain} />
      <div className="mt-5">
        <CaptureSheet
          domain={domain}
          treeId={params.treeId}
          rainHintMm={weather?.week?.[0]?.rainMm ?? weather?.rainMm}
          plots={plots}
          animals={animals}
          visionEnabled={isVisionConfigured()}
          source={params.source}
        />
      </div>
    </div>
  );
}
