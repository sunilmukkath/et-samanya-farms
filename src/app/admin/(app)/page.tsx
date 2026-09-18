import { canPersistFarmData, dashboardStats, emptyDashboardStats, isDatabaseConfigured } from "@/db/queries";
import { domains, timeAgo, treeCensusTarget } from "@/lib/farm";
import { getFarmWeather, weatherLabel } from "@/lib/weather";
import Link from "next/link";

export default async function AdminHomePage() {
  const persist = canPersistFarmData();
  const neon = isDatabaseConfigured();
  const stats = persist ? await dashboardStats() : emptyDashboardStats();
  const weather = await getFarmWeather();
  const watch = (stats.healthCounts.watch ?? 0) + (stats.healthCounts.stressed ?? 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      {!neon ? (
        <p className="mb-4 rounded-2xl bg-cream px-4 py-3 text-sm text-ink-soft">
          Local log is on. Add a Neon <code>DATABASE_URL</code> before deploying so the census stays on the
          server.
        </p>
      ) : null}

      <section className="rounded-3xl bg-leaf-deep px-5 py-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">Thenkulapakkam now</p>
        <p className="mt-2 font-display text-4xl">
          {weather?.tempC != null ? `${Math.round(weather.tempC)}°` : "—"}
          <span className="ml-2 text-lg font-normal text-sand">
            {weatherLabel(weather?.code)} · {weather?.humidity ?? "—"}% hum
          </span>
        </p>
        <p className="mt-2 text-sm text-sand">
          {weather?.weekRainMm != null ? `${weather.weekRainMm.toFixed(1)} mm rain this week` : "Weather pause"}
        </p>
      </section>

      <Link
        href="/admin/map"
        className="mt-4 flex items-center justify-between rounded-3xl border border-line bg-white px-5 py-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Tree census</p>
          <p className="font-display text-3xl">
            {stats.treeCount}{" "}
            <span className="text-lg text-muted">/ {treeCensusTarget}</span>
          </p>
          <p className="text-sm text-ink-soft">
            {watch ? `${watch} on watch or stressed` : "Walk the rows. Pin each stem."}
          </p>
        </div>
        <span className="tap inline-flex items-center rounded-full bg-leaf px-4 text-sm font-semibold text-leaf-deep">
          Map
        </span>
      </Link>

      <Link
        href="/admin/log"
        className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep text-lg font-semibold text-cream"
      >
        Log now
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {domains.map((domain) => (
          <Link
            key={domain.slug}
            href={`/admin/log?domain=${domain.slug}`}
            className="rounded-3xl border border-line bg-white px-4 py-4"
          >
            <p className="font-tamil text-xs text-muted">{domain.tamil}</p>
            <p className="font-display text-xl leading-tight">{domain.label}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {stats.weekByDomain[domain.slug] ?? 0} this week
            </p>
            <p className="text-xs text-muted">{timeAgo(stats.lastByDomain[domain.slug])}</p>
          </Link>
        ))}
      </div>

      {stats.speciesCounts.length ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Species on the map</h2>
          <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white">
            {stats.speciesCounts.slice(0, 8).map((row) => (
              <li key={row.species} className="flex justify-between px-4 py-3 text-sm">
                <span>{row.species}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
