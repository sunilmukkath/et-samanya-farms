import { listLedger, listObservationsSince, listTrees } from "@/db/queries";
import type { ObservationRow } from "@/db/schema";
import { getFarmProfile } from "@/lib/profile";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yearOf(date: Date) {
  return date.getFullYear();
}

export type MonthBucket = {
  key: string;
  label: string;
  rainMm: number;
  harvestKg: number;
  labourHours: number;
  stayNotes: number;
};

export function seasonBook(rows: ObservationRow[]) {
  const map = new Map<string, MonthBucket>();
  for (const row of rows) {
    const key = monthKey(row.occurredAt);
    const bucket =
      map.get(key) ??
      ({
        key,
        label: `${MONTHS[row.occurredAt.getMonth()]} ${row.occurredAt.getFullYear()}`,
        rainMm: 0,
        harvestKg: 0,
        labourHours: 0,
        stayNotes: 0,
      } satisfies MonthBucket);
    if (row.domain === "rain" && row.details?.rainMm) bucket.rainMm += Number(row.details.rainMm);
    if (row.domain === "harvest" && row.details?.quantity) bucket.harvestKg += Number(row.details.quantity);
    if (row.details?.hours) bucket.labourHours += Number(row.details.hours);
    if (row.domain === "stay") bucket.stayNotes += 1;
    map.set(key, bucket);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function yearOverYear(rows: ObservationRow[]) {
  const years = new Map<number, { rainMm: number; harvestKg: number; treesNoted: number; survival: number }>();
  for (const row of rows) {
    const y = yearOf(row.occurredAt);
    const bucket = years.get(y) ?? { rainMm: 0, harvestKg: 0, treesNoted: 0, survival: 0 };
    if (row.domain === "rain" && row.details?.rainMm) bucket.rainMm += Number(row.details.rainMm);
    if (row.domain === "harvest" && row.details?.quantity) bucket.harvestKg += Number(row.details.quantity);
    if (row.domain === "trees") bucket.treesNoted += 1;
    years.set(y, bucket);
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, stats]) => ({ year, ...stats }));
}

export function plantingWindows(rows: ObservationRow[], crops: string[]) {
  const byCrop = new Map<string, number[]>();
  for (const row of rows) {
    if (row.domain !== "plants") continue;
    const crop = row.details?.crop;
    const stage = row.details?.stage;
    if (!crop) continue;
    if (stage && stage !== "Seedling") continue;
    const months = byCrop.get(crop) ?? [];
    months.push(row.occurredAt.getMonth());
    byCrop.set(crop, months);
  }
  return crops
    .map((crop) => {
      const months = byCrop.get(crop) ?? [];
      if (!months.length) return null;
      const counts = Array.from({ length: 12 }, () => 0);
      for (const month of months) counts[month] += 1;
      const best = counts
        .map((count, month) => ({ month, count }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count);
      return {
        crop,
        window: best.slice(0, 2).map((row) => MONTHS[row.month]),
        events: months.length,
      };
    })
    .filter((row): row is { crop: string; window: string[]; events: number } => Boolean(row));
}

export function harvestByCrop(rows: ObservationRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.domain !== "harvest") continue;
    const crop = row.details?.crop || "Other";
    map.set(crop, (map.get(crop) ?? 0) + Number(row.details?.quantity ?? 0));
  }
  return [...map.entries()]
    .map(([crop, kg]) => ({ crop, kg }))
    .sort((a, b) => b.kg - a.kg);
}

export async function loadSeasonIntelligence() {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 3);
  const [rows, trees, money, profile] = await Promise.all([
    listObservationsSince(since, 800),
    listTrees(),
    listLedger(120),
    getFarmProfile(),
  ]);
  const dead = trees.filter((tree) => tree.health === "dead").length;
  const yoy = yearOverYear(rows).map((row) => ({
    ...row,
    survival: trees.length ? Math.round(((trees.length - dead) / trees.length) * 100) : 0,
  }));
  const income = money.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.amount, 0);
  const expense = money.filter((row) => row.kind === "expense").reduce((sum, row) => sum + row.amount, 0);
  return {
    months: seasonBook(rows).slice(-18),
    yoy,
    windows: plantingWindows(rows, profile.harvestCrops),
    harvestByCrop: harvestByCrop(rows),
    ledger: { income, expense, net: income - expense },
    treeSurvival: { living: trees.length - dead, dead, pct: trees.length ? Math.round(((trees.length - dead) / trees.length) * 100) : 0 },
  };
}
