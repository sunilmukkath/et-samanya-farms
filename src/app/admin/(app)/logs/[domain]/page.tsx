import { domainBySlug, isObservationDomain, timeAgo } from "@/lib/farm";
import { listObservations } from "@/db/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DomainLogPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  if (!isObservationDomain(domain)) notFound();
  const meta = domainBySlug[domain];
  const rows = await listObservations({ domain, limit: 60 });

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <p className="font-tamil text-sm text-muted">{meta.tamil}</p>
      <h1 className="font-display text-4xl">{meta.label}</h1>
      <Link
        href={`/admin/log?domain=${domain}`}
        className="tap mt-4 inline-flex items-center rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream"
      >
        Add a note
      </Link>

      <ul className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            Nothing logged yet. Walk the plot and save the first note.
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded-3xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {timeAgo(row.occurredAt)}
              </p>
              {row.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.photoUrl} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />
              ) : null}
              <p className="mt-2 text-base">{row.note || summary(row.details as Record<string, unknown> | null)}</p>
              {row.weather?.tempC != null ? (
                <p className="mt-1 text-xs text-muted">
                  {Math.round(row.weather.tempC)}° · {row.weather.humidity ?? "—"}% hum
                  {row.weather.weekRainMm != null ? ` · week ${row.weather.weekRainMm.toFixed(1)} mm` : ""}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function summary(details: Record<string, unknown> | null | undefined) {
  if (!details) return "Logged";
  const bits = Object.entries(details)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return bits.join(" · ") || "Logged";
}
