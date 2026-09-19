import { createPlantStandAction } from "@/app/admin/actions";
import { listPlantStands, listPlots } from "@/db/queries";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

export default async function StandsPage() {
  const [rows, plots, runtime] = await Promise.all([listPlantStands(), listPlots(), getRuntimeFarm()]);
  const plotName = Object.fromEntries(plots.map((plot) => [plot.id, plot.name]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Beds / crop cycles</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Named horticulture rows. Attach plant logs to a bed so next season you remember what sat where.
      </p>
      <form action={createPlantStandAction} className="mt-5 space-y-3 rounded-3xl border border-line bg-white p-4">
        <input name="name" required placeholder="Bed name" className="tap w-full rounded-2xl border border-line px-3" />
        <select name="crop" className="tap w-full rounded-2xl border border-line px-3">
          {runtime.harvestCrops.map((crop) => (
            <option key={crop}>{crop}</option>
          ))}
        </select>
        <select name="stage" className="tap w-full rounded-2xl border border-line px-3">
          <option value="seedling">Seedling</option>
          <option value="growing">Growing</option>
          <option value="flowering">Flowering</option>
          <option value="harvest">Harvest</option>
          <option value="fallow">Fallow</option>
        </select>
        {plots.length ? (
          <select name="plotId" className="tap w-full rounded-2xl border border-line px-3">
            <option value="">Plot (optional)</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        ) : null}
        <input name="plantedOn" type="date" className="tap w-full rounded-2xl border border-line px-3" />
        <button type="submit" className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream">
          Add bed
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            No beds yet. Add the horticulture rows you walk every morning.
          </li>
        ) : (
          rows.map((stand) => (
            <li key={stand.id} className="rounded-3xl border border-line bg-white px-4 py-4">
              <p className="font-display text-2xl">{stand.name}</p>
              <p className="text-sm text-ink-soft">
                {stand.crop} · {stand.stage}
                {stand.plotId && plotName[stand.plotId] ? ` · ${plotName[stand.plotId]}` : ""}
                {stand.plantedOn
                  ? ` · in ${new Date(stand.plantedOn).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                  : ""}
              </p>
              <Link
                href={`/admin/log?domain=plants&plantStandId=${stand.id}`}
                className="tap mt-3 inline-flex items-center justify-center rounded-full bg-leaf-deep px-4 text-sm font-semibold text-cream"
              >
                Log on this bed
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
