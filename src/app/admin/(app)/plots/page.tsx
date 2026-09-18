import { createPlotAction } from "@/app/admin/actions";
import { listPlots } from "@/db/queries";
import { plotKindOptions } from "@/lib/farm";
import Link from "next/link";

export default async function PlotsPage() {
  const rows = await listPlots();

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-4xl">Plots</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Named beds and yards. Attach logs to a plot so harvest and rain sit on a place, not only free text.
      </p>
      <form action={createPlotAction} className="mt-5 space-y-3 rounded-3xl border border-line bg-white p-4">
        <input name="name" required placeholder="Name" className="tap w-full rounded-2xl border border-line px-3" />
        <select name="kind" className="tap w-full rounded-2xl border border-line px-3">
          {plotKindOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream">
          Add plot
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {rows.map((plot) => (
          <li key={plot.id} className="rounded-3xl border border-line bg-white px-4 py-4">
            <p className="font-display text-2xl">{plot.name}</p>
            <p className="text-sm text-ink-soft">
              {plotKindOptions.find((opt) => opt.value === plot.kind)?.label ?? plot.kind}
              {plot.polygon ? " · outline on map" : " · name only for now"}
            </p>
            <Link href={`/admin/log?domain=plants`} className="mt-2 inline-block text-sm text-clay">
              Log on a bed
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
