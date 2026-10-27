import { booksSnapshot, canPersistFarmData, dashboardStats, emptyDashboardStats, latestReadings, listAlerts, listDevices, listObservations, listTasks, listZones } from "@/db/queries";
import { formatInr } from "@/lib/accounts";
import { currentRole } from "@/lib/admin";
import { OnFarmWater } from "@/components/admin/OnFarmWater";
import { WeatherStrip } from "@/components/admin/WeatherStrip";
import { finishTreeCountAction, useSamanyaFarmAction } from "@/app/admin/actions";
import { censusTotals, sectionCensus } from "@/lib/census";
import { phiHolds, phiLabel } from "@/lib/phi";
import { getRuntimeFarm } from "@/lib/profile";
import { farmLooksUnset } from "@/lib/profiles/samanya";
import { onFarmWater } from "@/lib/water";
import { getFarmWeather, todayRainMm, weatherLabel } from "@/lib/weather";
import Link from "next/link";

export default async function AdminHomePage() {
  const persist = canPersistFarmData();
  const role = await currentRole();
  const runtime = await getRuntimeFarm();
  const unset = farmLooksUnset(runtime);
  const stats = persist ? await dashboardStats() : emptyDashboardStats();
  const books = persist && role === "operator" ? await booksSnapshot() : null;
  const weather = await getFarmWeather();
  const rainToday = todayRainMm(weather);
  const watch = (stats.healthCounts.watch ?? 0) + (stats.healthCounts.stressed ?? 0);
  const tasks = persist ? await listTasks(false) : [];
  const devices = persist ? await listDevices() : [];
  const readings = persist && devices.length ? await latestReadings() : [];
  const alerts = persist ? await listAlerts(false) : [];
  const recent = persist ? await listObservations({ limit: 80 }) : [];
  const censusRows = persist ? await listObservations({ domain: "trees", limit: 120 }) : [];
  const zones = persist ? await listZones() : [];
  const water = onFarmWater(recent);
  const holds = phiHolds(recent);
  const fenceOn = zones.some((zone) => zone.name === "Farm boundary" && zone.polygon);
  const sections = sectionCensus(censusRows);
  const totals = censusTotals(sections);
  const noisyNodes = devices.filter((device) => device.status === "stale" || device.status === "error");
  const showNodes = Boolean(alerts[0] || noisyNodes.length);

  return (
    <div className="texture grain">
      <div className="mx-auto max-w-xl px-4 py-5 pb-8">
        <p className="mb-3 font-tamil text-sm text-muted">
          {role === "staff" ? "பணியாளர்" : runtime.location.village || runtime.shortName} · field notebook
        </p>

        {unset ? (
          <section className="mb-4 rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Welcome</p>
            <h2 className="mt-1 font-display text-3xl leading-tight">The log is open.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Rain, trees, and bills work before the fence is walked. Name the farm when you are ready.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {role === "operator" ? (
                <form action={useSamanyaFarmAction}>
                  <button type="submit" className="tap w-full rounded-full bg-leaf-deep font-semibold text-cream">
                    This is ET Samanya
                  </button>
                </form>
              ) : null}
              <Link href="/admin/log" className="tap flex items-center justify-center rounded-full border border-line font-semibold">
                Log something now
              </Link>
              <Link href="/admin/setup" className="text-center text-sm font-semibold text-leaf-deep">
                Set the name and pin
              </Link>
            </div>
          </section>
        ) : null}

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
              {rainToday != null ? `${rainToday.toFixed(1)} mm rain today` : "Weather pause"}
            </span>
            {stats.rainMmWeek ? (
              <span className="rounded-full bg-cream/15 px-3 py-1 text-sm">gauge {stats.rainMmWeek.toFixed(1)} mm</span>
            ) : null}
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-sand">
              {weather?.humidity ?? "—"}% humidity
            </span>
          </div>
          {weather?.week.length ? <WeatherStrip days={weather.week} todayDate={weather.todayDate} /> : null}
          <Link href="/admin/weather" className="mt-4 inline-block text-sm font-semibold text-sun">
            Week, month, and year
          </Link>
        </section>

        {!fenceOn ? (
          <section className="mt-4 rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">When you are on the land</p>
            <p className="mt-1 font-display text-2xl">Walk the outer fence</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Follow the outer fence with the phone. Acres come from that walk. The log and the rest of the map work before you do this.
            </p>
            <Link
              href="/admin/map?walk=fence"
              className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep font-semibold text-cream"
            >
              Start the fence walk
            </Link>
          </section>
        ) : (
          <section className="mt-4 rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {runtime.acres ? `${runtime.acres} acres from the fence` : "Fence is on the map"}
            </p>
            <p className="mt-1 font-display text-2xl">
              {sections.length ? `${totals.trees} trees · ${totals.plants} plants` : "Photograph each section"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {sections.length
                ? `${sections.length} section${sections.length === 1 ? "" : "s"} counted from photos. You confirmed every number.`
                : "Stand in a belt, take a photo, and confirm how many saplings and trees are in that frame."}
            </p>
            {sections.length ? (
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {sections.map((section) => (
                  <li key={section.key}>
                    {section.name}: {section.trees} trees
                    {section.plants ? ` · ${section.plants} plants` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/admin/map?count=1"
              className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep font-semibold text-cream"
            >
              {sections.length ? "Count another belt" : "Count a belt"}
            </Link>
            {sections.length && !runtime.censusDoneAt ? (
              <form action={finishTreeCountAction} className="mt-3">
                <button type="submit" className="tap w-full rounded-full border border-line font-semibold">
                  The planted trees are counted
                </button>
              </form>
            ) : null}
          </section>
        )}

        <OnFarmWater water={water} />

        {holds.length ? (
          <Link href="/admin/log?domain=plant_health&view=past" className="mt-4 block rounded-[1.75rem] bg-cream px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Wait to pick</p>
            <p className="mt-1 text-base">
              {holds.map((hold) => `${hold.crop}: ${phiLabel(hold.until)}`).join(" · ")}
            </p>
          </Link>
        ) : null}

        {showNodes ? (
          <Link href="/admin/nodes" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Node needs a look</p>
            {alerts[0] ? <p className="mt-2 text-base text-clay">{alerts[0].title}</p> : null}
            {noisyNodes[0] ? (
              <p className="mt-1 text-sm text-ink-soft">
                {noisyNodes[0].name} · {noisyNodes[0].status}
                {readings.find((row) => row.deviceId === noisyNodes[0].id)
                  ? ` · ${readings.find((row) => row.deviceId === noisyNodes[0].id)?.value}${readings.find((row) => row.deviceId === noisyNodes[0].id)?.unit ?? ""}`
                  : ""}
              </p>
            ) : null}
          </Link>
        ) : null}

        {watch ? (
          <Link href="/admin/map" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Trees on watch</p>
            <p className="mt-1 font-display text-2xl">{watch} stems</p>
            <p className="text-sm text-ink-soft">Walk the rows. Recheck stressed stems.</p>
          </Link>
        ) : null}

        {tasks.length ? (
          <Link href="/admin/tasks" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Work list</p>
            <p className="mt-1 font-display text-2xl">{tasks.length} open</p>
            <p className="text-sm text-ink-soft">{tasks[0]?.title}</p>
          </Link>
        ) : null}

        {books ? (
          <Link href="/admin/books" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Books · {books.fy.label}</p>
            <p className="mt-1 font-display text-2xl">{formatInr((books.monthIn ?? 0) - (books.monthOut ?? 0))}</p>
            <p className="text-sm text-ink-soft">
              {books.vouchers.length
                ? `In ${formatInr(books.monthIn)} · Out ${formatInr(books.monthOut)} this month`
                : "Photograph a bill or paste a bank SMS."}
            </p>
          </Link>
        ) : null}

        <Link
          href="/admin/log"
          className="tap mt-6 flex items-center justify-center rounded-full bg-leaf-deep text-lg font-semibold text-cream"
        >
          Log
        </Link>
      </div>
    </div>
  );
}
