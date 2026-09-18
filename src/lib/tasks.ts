import { insertTask, listObservations, listTasks, listTrees } from "@/db/queries";
import type { ObservationDomain, TaskRow } from "@/db/schema";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(date: Date | string | null | undefined) {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / DAY;
}

export async function deriveFarmTasks(): Promise<TaskRow[]> {
  const [trees, observations, existing] = await Promise.all([
    listTrees(),
    listObservations({ limit: 200 }),
    listTasks(true),
  ]);
  const lastByDomain: Record<string, Date> = {};
  const lastSoilAction = observations.find(
    (row) => row.domain === "soil" && (row.details?.action === "Compost" || row.note?.toLowerCase().includes("compost")),
  );
  const lastRain = observations.find((row) => row.domain === "rain");
  const lastHarvest = observations.find((row) => row.domain === "harvest");
  const lastKit = observations.find((row) => row.domain === "kit" || row.details?.irrigationMinutes);
  for (const row of observations) {
    if (!lastByDomain[row.domain] || row.occurredAt > lastByDomain[row.domain]) {
      lastByDomain[row.domain] = row.occurredAt;
    }
  }

  const wanted: { title: string; domain: ObservationDomain | null; treeId: string | null }[] = [];

  for (const tree of trees) {
    if (tree.health !== "watch" && tree.health !== "stressed") continue;
    const last = observations.find((row) => row.treeId === tree.id);
    if (daysAgo(last?.occurredAt ?? tree.updatedAt) >= 3) {
      wanted.push({
        title: `Recheck ${tree.species} (${tree.health})`,
        domain: "plant_health",
        treeId: tree.id,
      });
    }
  }

  if (daysAgo(lastByDomain.rain) >= 7) {
    wanted.push({ title: "Log rain and pond level", domain: "rain", treeId: null });
  }
  if (daysAgo(lastSoilAction?.occurredAt ?? lastByDomain.soil) >= 9) {
    wanted.push({ title: "Turn compost / note the heap", domain: "soil", treeId: null });
  }
  if (lastRain && daysAgo(lastRain.occurredAt) <= 2 && daysAgo(lastKit?.occurredAt) >= 2) {
    wanted.push({ title: "Inspect drip after rain", domain: "kit", treeId: null });
  }
  if (daysAgo(lastHarvest?.occurredAt) >= 6) {
    wanted.push({ title: "Walk harvest beds", domain: "harvest", treeId: null });
  }

  const openTitles = new Set(
    existing.filter((task) => !task.completedAt).map((task) => `${task.title}|${task.treeId ?? ""}`),
  );

  const created: TaskRow[] = [];
  for (const item of wanted.slice(0, 20)) {
    const key = `${item.title}|${item.treeId ?? ""}`;
    if (openTitles.has(key)) continue;
    created.push(
      await insertTask({
        title: item.title,
        dueAt: new Date(),
        source: "ai",
        domain: item.domain,
        treeId: item.treeId,
        plotId: null,
        animalId: null,
        completedAt: null,
        completedObservationId: null,
      }),
    );
  }
  return created;
}
