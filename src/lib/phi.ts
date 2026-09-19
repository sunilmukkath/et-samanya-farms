export type PhiHold = {
  crop: string;
  until: string;
  product: string | null;
};

export function applyPhi(
  details: { phiDays?: number; safeToPickOn?: string },
  occurredAt = new Date(),
) {
  if (details.safeToPickOn) return details;
  if (details.phiDays == null || !Number.isFinite(details.phiDays)) return details;
  const when = new Date(occurredAt);
  when.setDate(when.getDate() + Math.max(0, Math.round(details.phiDays)));
  details.safeToPickOn = when.toISOString().slice(0, 10);
  return details;
}

export function phiLabel(until: string, today = new Date()) {
  const day = today.toISOString().slice(0, 10);
  const pretty = new Date(`${until}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  if (until <= day) return `Safe to pick (${pretty})`;
  return `Wait to pick until ${pretty}`;
}

export function phiHolds(
  rows: { domain: string; details?: { crop?: string; safeToPickOn?: string; sprayProduct?: string } | null }[],
  today = new Date(),
): PhiHold[] {
  const day = today.toISOString().slice(0, 10);
  const byCrop = new Map<string, PhiHold>();
  for (const row of rows) {
    if (row.domain !== "plant_health") continue;
    const until = row.details?.safeToPickOn;
    if (!until || until < day) continue;
    const crop = row.details?.crop || "crop";
    if (byCrop.has(crop)) continue;
    byCrop.set(crop, {
      crop,
      until,
      product: row.details?.sprayProduct ?? null,
    });
  }
  return [...byCrop.values()];
}
