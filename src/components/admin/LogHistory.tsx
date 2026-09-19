import { ShareNote } from "@/components/admin/ShareNote";
import type { ObservationRow } from "@/db/schema";
import { timeAgo } from "@/lib/farm";
import { phiLabel } from "@/lib/phi";

export function LogHistory({
  rows,
  domain,
  farmName,
  mixed,
}: {
  rows: ObservationRow[];
  domain?: string;
  farmName: string;
  mixed?: boolean;
}) {
  if (!rows.length) {
    return (
      <ul className="mt-6 space-y-3">
        <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
          Nothing logged yet. Walk the plot and save the first note.
        </li>
      </ul>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => {
        const slug = domain ?? row.domain;
        const shareable = slug === "harvest" || slug === "trees" || slug === "plant_health";
        const title =
          slug === "harvest"
            ? `${row.details?.crop ?? "Harvest"} · ${farmName}`
            : slug === "trees"
              ? `Tree note · ${farmName}`
              : `Plant health · ${farmName}`;
        const text =
          slug === "harvest"
            ? [
                row.details?.crop,
                row.details?.quantity != null ? `${row.details.quantity} ${row.details.unit ?? ""}`.trim() : null,
                row.details?.destination,
                row.note,
              ]
                .filter(Boolean)
                .join(" · ")
            : row.note || summary(row.details as Record<string, unknown> | null);
        return (
          <li key={row.id} className="rounded-3xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {mixed ? `${row.domain} · ` : ""}
              {timeAgo(row.occurredAt)}
              {row.source === "sensor" ? " · on-farm node" : ""}
            </p>
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photoUrl} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />
            ) : null}
            <p className="mt-2 text-base">{row.note || summary(row.details as Record<string, unknown> | null)}</p>
            {row.details?.safeToPickOn ? (
              <p className="mt-1 text-sm font-semibold text-clay">{phiLabel(row.details.safeToPickOn)}</p>
            ) : null}
            {row.weather?.tempC != null ? (
              <p className="mt-1 text-xs text-muted">
                {Math.round(row.weather.tempC)}° · {row.weather.humidity ?? "—"}% hum
                {row.weather.weekRainMm != null ? ` · week ${row.weather.weekRainMm.toFixed(1)} mm` : ""}
              </p>
            ) : null}
            {shareable ? (
              <div className="mt-2">
                <ShareNote title={title} text={text} photoUrl={row.photoUrl} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function summary(details: Record<string, unknown> | null | undefined) {
  if (!details) return "Logged";
  const bits = Object.entries(details)
    .filter(([key, value]) => value != null && value !== "" && key !== "aiSuggestion")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return bits.join(" · ") || "Logged";
}
