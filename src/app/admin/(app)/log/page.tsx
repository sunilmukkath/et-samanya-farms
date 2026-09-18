import { CaptureSheet, DomainPicker } from "@/components/admin/CaptureSheet";
import { isObservationDomain } from "@/lib/farm";
import { getFarmWeather } from "@/lib/weather";

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; treeId?: string }>;
}) {
  const params = await searchParams;
  const requested = params.domain ?? "";
  const domain = isObservationDomain(requested) ? requested : "rain";
  const weather = await getFarmWeather();

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <DomainPicker current={domain} />
      <div className="mt-5">
        <CaptureSheet
          domain={domain}
          treeId={params.treeId}
          rainHintMm={weather?.week?.[0]?.rainMm ?? weather?.rainMm}
        />
      </div>
    </div>
  );
}
