import { canPersistFarmData, dashboardStats, emptyDashboardStats, latestReadings, listAlerts, listDevices, listObservations, listTasks } from "@/db/queries";
import { redirect } from "next/navigation";
import { currentRole } from "@/lib/admin";
import { currentBrief } from "@/lib/brief";
import { OnFarmWater } from "@/components/admin/OnFarmWater";
import { timeAgo } from "@/lib/farm";
import { kernelChecks } from "@/lib/kernel";
import { phiHolds, phiLabel } from "@/lib/phi";
import { getRuntimeFarm } from "@/lib/profile";
import { onFarmWater } from "@/lib/water";
import { getFarmWeather, weatherLabel } from "@/lib/weather";
import Link from "next/link";

export default async function AdminHomePage() {
  const persist = canPersistFarmData();
  const role = await currentRole();
  const runtime = await getRuntimeFarm();
  if (!runtime.onboardedAt) redirect("/admin/setup");
  const stats = persist ? await dashboardStats() : emptyDashboardStats();
  const weather = await getFarmWeather();
  const watch = (stats.healthCounts.watch ?? 0) + (stats.healthCounts.stressed ?? 0);
  const checks = kernelChecks();
  const kernelGap = checks.filter((check) => !check.ok);
  const brief = persist ? await currentBrief("weekly").catch(() => null) : null;
  const tasks = persist ? await listTasks(false) : [];
  const target = runtime.treeCensusTarget ?? 0;
  const censusPct = target ? Math.min(100, Math.round((stats.treeCount / target) * 100)) : 0;
  const speciesMax = Math.max(1, ...stats.speciesCounts.map((row) => row.count));
  const devices = persist ? await listDevices() : [];
  const readings = persist && devices.length ? await latestReadings() : [];
  const alerts = persist ? await listAlerts(false) : [];
  const recent = persist ? await listObservations({ limit: 80 }) : [];
  const water = onFarmWater(recent);
  const holds = phiHolds(recent);
  const showTrees = runtime.modules.includes("trees") && target > 0;

  return (
    <div className="texture grain">
      <div className="mx-auto max-w-xl px-4 py-5">
        {kernelGap.length ? (
          <div className="mb-4 space-y-2">
            {kernelGap.map((check) => (
              <p key={check.id} className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm text-ink-soft">
                <span className="font-semibold text-ink">{check.label}:</span> {check.hint}
              </p>
            ))}
          </div>
        ) : (
          <p className="mb-3 font-tamil text-sm text-muted">
            {role === "staff" ? "பணியாளர்" : runtime.location.village || runtime.shortName} · field notebook
          </p>
        )}

        <section className="rounded-[1.75rem] bg-leaf-deep px-5 py-5 text-cream">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">
            {runtime.location.village || runtime.shortName} now
          </p>
          <p className="mt-2 font-display text-5xl leading-none tracking-tight sm:text-6xl">
            {weather?.tempC != null ? `${Math.round(weather.tempC)}°` : "—"}
          </p>
          <p className="mt-2 text-base text-sand">{weatherLabel(weather?.code)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-cream/15 px-3 py-1 text-sm">
              {weather?.weekRainMm != null ? `${weather.weekRainMm.toFixed(1)} mm rain` : "Weather pause"}
            </span>
            {stats.rainMmWeek ? (
              <span className="rounded-full bg-cream/15 px-3 py-1 text-sm">gauge {stats.rainMmWeek.toFixed(1)} mm</span>
            ) : null}
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-sand">
              {weather?.humidity ?? "—"}% humidity
            </span>
          </div>
        </section>

        <OnFarmWater water={water} />

        {holds.length ? (
          <Link href="/admin/logs/plant_health" className="mt-4 block rounded-[1.75rem] bg-cream px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Wait to pick</p>
            <p className="mt-1 text-base">
              {holds.map((hold) => `${hold.crop}: ${phiLabel(hold.until)}`).join(" · ")}
            </p>
          </Link>
        ) : null}

        {devices.length ? (
          <Link href="/admin/nodes" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Live nodes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {devices.slice(0, 6).map((device) => {
                const latest = readings.find((row) => row.deviceId === device.id);
                return (
                  <span key={device.id} className="rounded-full bg-cream px-3 py-1 text-sm">
                    {device.name}
                    {latest ? ` ${latest.value}${latest.unit ?? ""}` : ` · ${device.status}`}
                  </span>
                );
              })}
            </div>
            {alerts[0] ? <p className="mt-2 text-sm text-clay">{alerts[0].title}</p> : null}
          </Link>
        ) : null}

        {showTrees ? (
          <Link
            href="/admin/map"
            className="mt-4 block rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-tamil text-sm text-clay">மரம்</p>
                <p className="font-display text-3xl leading-tight">
                  {stats.treeCount}
                  <span className="text-lg text-muted"> / {target}</span>
                </p>
              </div>
              {watch ? (
                <span className="rounded-full bg-clay px-3 py-1 text-sm font-semibold text-cream">{watch} on watch</span>
              ) : (
                <span className="text-sm font-semibold text-leaf-deep">Map</span>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
              <div className="h-full rounded-full bg-leaf-deep" style={{ width: `${censusPct}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {watch ? "Walk the rows. Recheck stressed stems." : "Walk the rows. Pin each stem."}
            </p>
          </Link>
        ) : (
          <Link href="/admin/map" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]">
            <p className="font-display text-3xl">Map</p>
            <p className="mt-1 text-sm text-ink-soft">Plots, pins, and nodes on this land.</p>
          </Link>
        )}

        <Link
          href="/admin/log"
          className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep text-lg font-semibold text-cream"
        >
          Log now
        </Link>

        {brief ? (
          <Link href="/admin/brief" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="font-tamil text-sm text-clay">வாரம்</p>
            <p className="font-display text-2xl">Weekly brief</p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
              {brief.markdown.split("\n").filter(Boolean).slice(0, 3).join(" ")}
            </p>
          </Link>
        ) : null}

        {tasks.length ? (
          <Link href="/admin/tasks" className="mt-3 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Work list</p>
            <p className="mt-1 font-display text-2xl">{tasks.length} open</p>
            <p className="text-sm text-ink-soft">{tasks[0]?.title}</p>
          </Link>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {runtime.domains.map((domain) => (
            <Link
              key={domain.slug}
              href={domain.slug === "stay" ? "/admin/stay" : `/admin/log?domain=${domain.slug}`}
              className="min-h-[6.75rem] rounded-[1.5rem] bg-white px-3.5 py-3.5 shadow-[var(--shadow)]"
            >
              <p className="font-tamil text-sm text-clay">{domain.tamil}</p>
              <p className="mt-1 font-display text-xl leading-tight sm:text-2xl">{domain.label}</p>
              <p className="mt-3 text-sm text-ink-soft">{timeAgo(stats.lastByDomain[domain.slug])}</p>
            </Link>
          ))}
        </div>

        {showTrees && stats.speciesCounts.length ? (
          <section className="mt-6">
            <h2 className="font-display text-2xl">Species on the map</h2>
            <ul className="mt-3 space-y-3">
              {stats.speciesCounts.slice(0, 8).map((row) => (
                <li key={row.species}>
                  <div className="flex justify-between text-sm">
                    <span>{row.species}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-leaf-deep"
                      style={{ width: `${(row.count / speciesMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-3 pb-6 text-sm">
          <Link href="/admin/search" className="font-semibold text-leaf-deep underline decoration-sun underline-offset-4">
            Ask the farm
          </Link>
          <Link href="/admin/more" className="font-semibold text-leaf-deep underline decoration-sun underline-offset-4">
            Season, plots, ledger
          </Link>
          <Link href="/" className="text-muted underline underline-offset-4">
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
