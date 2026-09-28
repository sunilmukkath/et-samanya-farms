import type { ObservationRow } from "@/db/schema";

export type SectionCensus = {
  key: string;
  name: string;
  plotId: string | null;
  trees: number;
  plants: number;
  at: Date;
};

export function sectionCensus(rows: ObservationRow[]): SectionCensus[] {
  const byKey = new Map<string, SectionCensus>();
  for (const row of rows) {
    if (row.details?.action !== "section-count") continue;
    const trees = Number(row.details.treeCount);
    const plants = Number(row.details.plantCount);
    if (!Number.isFinite(trees) && !Number.isFinite(plants)) continue;
    const name = row.details.section || "Section";
    const key = row.plotId || name;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      key,
      name,
      plotId: row.plotId,
      trees: Number.isFinite(trees) ? trees : 0,
      plants: Number.isFinite(plants) ? plants : 0,
      at: row.occurredAt,
    });
  }
  return [...byKey.values()];
}

export function censusTotals(sections: SectionCensus[]) {
  return sections.reduce(
    (sum, row) => ({ trees: sum.trees + row.trees, plants: sum.plants + row.plants }),
    { trees: 0, plants: 0 },
  );
}
