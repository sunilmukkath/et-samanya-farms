import { loadWeatherTrends, type TrendBucket, type TrendCompare } from "@/lib/weather-trends";
import Link from "next/link";

export default async function WeatherTrendsPage() {
  const trends = await loadWeatherTrends();

  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-10">
      <p className="font-tamil text-sm text-muted">வானிலை போக்கு</p>
      <h1 className="font-display text-4xl leading-none">Weather trends</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {trends
          ? `${trends.place}. Week, month, and year at the farm pin. Matched days only, so a half-finished week is compared with the same days last week.`
          : "Weather history did not load. The forecast on Home still stands."}
      </p>

      {trends ? (
        <>
          <div className="mt-5 space-y-3">
            <CompareCard row={trends.wow} />
            <CompareCard row={trends.mom} />
            <CompareCard row={trends.yoy} />
          </div>

          <Bars title="Week on week" hint="Eight weeks of rain, newest at the bottom." rows={trends.weeks} />
          <Bars title="Month on month" hint="Twelve months. The open month is only the days so far." rows={trends.months} />
          <Bars title="Year on year" hint="Two full years, then this year up to today." rows={trends.years} />

          <p className="mt-6 text-sm text-ink-soft">
            Bars are the sky model. A gauge line appears on a period where someone logged rain mm.
          </p>
        </>
      ) : null}

      <Link href="/admin/log?domain=rain&group=water" className="tap mt-5 flex items-center justify-center rounded-full bg-leaf-deep text-base font-semibold text-cream">
        Log the gauge
      </Link>
    </div>
  );
}

function CompareCard({ row }: { row: TrendCompare }) {
  const rain = deltaMm(row.rainDeltaMm);
  const temp = row.tempDeltaC == null ? null : deltaTemp(row.tempDeltaC);
  return (
    <section className="rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{row.title}</p>
      <p className="mt-2 font-display text-4xl leading-none">{trim(row.current.rainMm)} mm</p>
      <p className="mt-2 text-sm text-ink-soft">
        {row.previous.label} {trim(row.previous.rainMm)} mm
        {rain ? ` · ${rain}` : ""}
      </p>
      <p className="mt-1 text-sm">
        High {degrees(row.current.avgMaxC)} · low {degrees(row.current.avgMinC)}
        {temp ? ` · ${temp}` : ""}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {`${row.current.rainDays} rain ${row.current.rainDays === 1 ? "day" : "days"} · ${row.previous.label.toLowerCase()} ${row.previous.rainDays}`}
      </p>
      {row.current.gaugeMm != null || row.previous.gaugeMm != null ? (
        <p className="mt-2 text-sm">
          Gauge {row.current.gaugeMm != null ? `${trim(row.current.gaugeMm)} mm` : "—"} · {row.previous.label.toLowerCase()}{" "}
          {row.previous.gaugeMm != null ? `${trim(row.previous.gaugeMm)} mm` : "—"}
        </p>
      ) : null}
    </section>
  );
}

function Bars({ title, hint, rows }: { title: string; hint: string; rows: TrendBucket[] }) {
  const max = Math.max(1, ...rows.map((row) => row.rainMm));
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex justify-between gap-3 text-xs text-muted">
              <span>{row.label}</span>
              <span>
                {trim(row.rainMm)} mm
                {row.avgMaxC != null ? ` · ${Math.round(row.avgMaxC)}°` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
              <div className="h-full rounded-full bg-leaf-deep" style={{ width: `${Math.min(100, (row.rainMm / max) * 100)}%` }} />
            </div>
            {row.gaugeMm != null ? <p className="mt-0.5 text-[11px] text-ink-soft">Gauge {trim(row.gaugeMm)} mm</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function deltaMm(delta: number) {
  if (Math.abs(delta) < 0.5) return "about the same rain";
  return delta > 0 ? `${trim(delta)} mm more` : `${trim(Math.abs(delta))} mm less`;
}

function deltaTemp(delta: number) {
  if (Math.abs(delta) < 0.3) return "about the same high";
  const value = trim(Math.abs(delta));
  return delta > 0 ? `${value}° warmer` : `${value}° cooler`;
}

function degrees(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}°`;
}

function trim(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
