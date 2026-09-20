import { booksSnapshot, canPersistFarmData, dashboardStats, emptyDashboardStats, latestReadings, listAlerts, listDevices, listObservations, listPlots, listTasks, listVouchers } from "@/db/queries";
import { redirect } from "next/navigation";
import { currentRole } from "@/lib/admin";
import { FirstWalk } from "@/components/admin/FirstWalk";
import { OnFarmWater } from "@/components/admin/OnFarmWater";
import { firstWalk } from "@/lib/onboarding";
import { formatInr } from "@/lib/accounts";
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
  const tasks = persist ? await listTasks(false) : [];
  const devices = persist ? await listDevices() : [];
  const readings = persist && devices.length ? await latestReadings() : [];
  const alerts = persist ? await listAlerts(false) : [];
  const recent = persist ? await listObservations({ limit: 80 }) : [];
  const plots = persist ? await listPlots() : [];
  const vouchers = persist && role !== "staff" ? await listVouchers({ limit: 5 }) : [];
  const books = persist && role !== "staff" ? await booksSnapshot() : null;
  const walk = firstWalk({
    onboarded: Boolean(runtime.onboardedAt),
    plotCount: plots.length,
    noteCount: recent.length,
    voucherCount: vouchers.length,
    showBooks: role !== "staff",
  });
  const water = onFarmWater(recent);
  const holds = phiHolds(recent);
  const noisyNodes = devices.filter((device) => device.status === "stale" || device.status === "error");
  const showNodes = Boolean(alerts[0] || noisyNodes.length);

  return (
    <div className="texture grain">
      <div className="mx-auto max-w-xl px-4 py-5 pb-8">
        <p className="mb-3 font-tamil text-sm text-muted">
          {role === "staff" ? "பணியாளர்" : runtime.location.village || runtime.shortName} · field notebook
        </p>

        <FirstWalk steps={walk} />

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

        {role !== "staff" && books ? (
          <Link href="/admin/books" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Accounts books</p>
            <p className="mt-1 font-display text-2xl">
              {formatInr(books.monthIn - books.monthOut)}
              <span className="ml-2 font-sans text-sm font-normal text-muted">this month</span>
            </p>
            <p className="text-sm text-ink-soft">
              In {formatInr(books.monthIn)} · out {formatInr(books.monthOut)}. Open the day book.
            </p>
          </Link>
        ) : null}

        <div className={`mt-6 grid gap-2 ${role !== "staff" ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link
            href="/admin/log"
            className="tap flex items-center justify-center rounded-full bg-leaf-deep text-base font-semibold text-cream"
          >
            Log
          </Link>
          {role !== "staff" ? (
            <Link
              href="/admin/books/new"
              className="tap flex items-center justify-center rounded-full border border-line bg-white text-base font-semibold"
            >
              Books
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
