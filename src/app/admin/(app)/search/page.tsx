import { listObservations } from "@/db/queries";
import { domainBySlug, timeAgo } from "@/lib/farm";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const rows = query ? await listObservations({ query, limit: 40 }) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-4xl">Ask the farm</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Search the field book — notes, Tamil names, crop chips. Embeddings can wait; keyword is enough while the
        log is young.
      </p>
      <form className="mt-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="when did we last mulch the gourd beds?"
          className="tap w-full rounded-full border border-line bg-white px-5 text-base"
        />
      </form>
      <ul className="mt-6 space-y-3">
        {!query ? (
          <li className="text-sm text-ink-soft">Type a crop, a Tamil name, or a place on the plot.</li>
        ) : rows.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            Nothing matches yet. The knowledge bank is the notes you save.
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded-3xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {domainBySlug[row.domain]?.label ?? row.domain} · {timeAgo(row.occurredAt)}
              </p>
              <p className="mt-2">{row.note || "Logged"}</p>
              <Link href={`/admin/logs/${row.domain}`} className="mt-2 inline-block text-sm text-clay">
                Open {domainBySlug[row.domain]?.label ?? "log"}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
