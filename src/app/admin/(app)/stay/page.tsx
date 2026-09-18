import { CaptureSheet } from "@/components/admin/CaptureSheet";
import { listObservations } from "@/db/queries";
import { timeAgo } from "@/lib/farm";
import { isVisionConfigured } from "@/lib/farm";

export default async function AdminStayPage() {
  const rows = await listObservations({ domain: "stay", limit: 60 });

  return (
    <div className="texture grain">
      <div className="mx-auto max-w-xl px-4 py-5">
        <p className="font-tamil text-base text-clay">தங்கல்</p>
        <h1 className="font-display text-4xl">Farm stay</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Private occupancy notes. Not a public booking page.
        </p>

        <div className="mt-6">
          <CaptureSheet domain="stay" visionEnabled={isVisionConfigured()} redirectTo="/admin/stay" />
        </div>

        <h2 className="mt-2 font-display text-2xl">Occupancy</h2>
        <ul className="mt-3 space-y-3 pb-8">
          {rows.length === 0 ? (
            <li className="rounded-[1.75rem] bg-white px-4 py-6 text-sm text-ink-soft shadow-[var(--shadow)]">
              No stay notes yet. Log guests when someone is on the land.
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="rounded-[1.75rem] bg-white p-4 shadow-[var(--shadow)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {timeAgo(row.occurredAt)}
                </p>
                {row.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.photoUrl} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />
                ) : null}
                <p className="mt-2 text-base">{row.note || staySummary(row.details)}</p>
                {row.details?.guestCount != null || row.details?.stayFrom ? (
                  <p className="mt-1 text-sm text-ink-soft">
                    {row.details.guestCount != null ? `${row.details.guestCount} guests` : ""}
                    {row.details.stayFrom
                      ? `${row.details.guestCount != null ? " · " : ""}${row.details.stayFrom}${row.details.stayTo ? ` → ${row.details.stayTo}` : ""}`
                      : ""}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function staySummary(details: { guestCount?: number; stayFrom?: string; stayTo?: string } | null) {
  if (!details) return "Stay noted";
  const bits = [];
  if (details.guestCount != null) bits.push(`${details.guestCount} guests`);
  if (details.stayFrom) bits.push(details.stayFrom);
  if (details.stayTo) bits.push(`to ${details.stayTo}`);
  return bits.join(" · ") || "Stay noted";
}
