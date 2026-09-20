import { loadSeasonIntelligence } from "@/lib/seasons";

export default async function SeasonPage() {
  const data = await loadSeasonIntelligence();
  const maxRain = Math.max(1, ...data.months.map((row) => row.rainMm));
  const maxHarvest = Math.max(1, ...data.months.map((row) => row.harvestKg));

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Season book</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Rain, harvest, labour, and stay from your own history — not a generic India calendar.
      </p>

      <section className="mt-6 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Trees</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {data.treeSurvival.living} living · {data.treeSurvival.dead} dead · {data.treeSurvival.pct}% still
          standing on the census.
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Year over year</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.yoy.length === 0 ? (
            <li className="text-ink-soft">Need more than one season of notes.</li>
          ) : (
            data.yoy.map((row) => (
              <li key={row.year} className="flex justify-between gap-3">
                <span>{row.year}</span>
                <span className="text-ink-soft">
                  {row.rainMm.toFixed(0)} mm · {row.harvestKg.toFixed(1)} harvest · {row.survival}% trees
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Rain by month</h2>
        <ul className="mt-4 space-y-2">
          {data.months.length === 0 ? (
            <li className="text-sm text-ink-soft">Log gauge mm to fill this chart.</li>
          ) : (
            data.months.map((row) => (
              <li key={row.key}>
                <div className="flex justify-between text-xs text-muted">
                  <span>{row.label}</span>
                  <span>{row.rainMm.toFixed(1)} mm</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
                  <div className="h-full bg-leaf-deep" style={{ width: `${(row.rainMm / maxRain) * 100}%` }} />
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Harvest by month</h2>
        <ul className="mt-4 space-y-2">
          {data.months.map((row) => (
            <li key={`h-${row.key}`}>
              <div className="flex justify-between text-xs text-muted">
                <span>{row.label}</span>
                <span>{row.harvestKg.toFixed(1)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
                <div className="h-full bg-clay" style={{ width: `${(row.harvestKg / maxHarvest) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Planting windows from this plot</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.windows.length === 0 ? (
            <li className="text-ink-soft">Log plantings as Seedling to learn your windows.</li>
          ) : (
            data.windows.map((row) => (
              <li key={row.crop} className="flex justify-between">
                <span>{row.crop}</span>
                <span className="text-ink-soft">
                  {row.window.join(" / ")} · {row.events} notes
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
        <h2 className="font-display text-2xl">Accounts books</h2>
        <p className="mt-2 text-sm text-ink-soft">
          In ₹{data.ledger.income.toFixed(0)} · out ₹{data.ledger.expense.toFixed(0)} · net ₹
          {data.ledger.net.toFixed(0)}
        </p>
        <a href="/admin/books" className="mt-3 inline-block text-sm font-semibold text-leaf-deep">
          Open the day book
        </a>
      </section>
    </div>
  );
}
