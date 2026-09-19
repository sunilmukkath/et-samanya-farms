import { createAnimalAction } from "@/app/admin/actions";
import { listAnimals } from "@/db/queries";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

export default async function AnimalsPage() {
  const [rows, runtime] = await Promise.all([listAnimals(), getRuntimeFarm()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Animals</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Herd as entities. Manure notes still go on soil; feed and condition attach here.
      </p>
      <form action={createAnimalAction} className="mt-5 grid grid-cols-2 gap-3 rounded-3xl border border-line bg-white p-4">
        <input name="name" required placeholder="Name or tag" className="tap col-span-2 rounded-2xl border border-line px-3" />
        <input name="species" defaultValue={runtime.defaultAnimalKind} className="tap rounded-2xl border border-line px-3" />
        <select name="sex" className="tap rounded-2xl border border-line px-3">
          <option value="">Sex</option>
          <option>Female</option>
          <option>Male</option>
        </select>
        <input name="tag" placeholder="Ear tag" className="tap col-span-2 rounded-2xl border border-line px-3" />
        <button type="submit" className="tap col-span-2 rounded-full bg-leaf-deep text-sm font-semibold text-cream">
          Add to the herd
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            No animals yet. Add cattle when they arrive.
          </li>
        ) : (
          rows.map((animal) => (
            <li key={animal.id} className="rounded-3xl border border-line bg-white px-4 py-4">
              <p className="font-display text-2xl">{animal.name}</p>
              <p className="text-sm text-ink-soft">
                {animal.species}
                {animal.tag ? ` · ${animal.tag}` : ""} · {animal.status}
              </p>
              <Link
                href={`/admin/log?domain=animals`}
                className="mt-2 inline-block text-sm text-clay"
              >
                Log feed or condition
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
