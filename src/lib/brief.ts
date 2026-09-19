import { dashboardStats, insertBrief, latestBrief, listObservations, listTasks, listTrees } from "@/db/queries";
import type { BriefRow, BriefStats } from "@/db/schema";
import { getFarmProfile } from "@/lib/profile";
import { geminiGenerateText } from "@/lib/vision";
import { getFarmWeather, weatherLabel } from "@/lib/weather";

function templateBrief(stats: BriefStats, weatherLine: string) {
  const lines = [
    weatherLine,
    `${stats.treeCount} trees pinned. ${stats.watchCount} on watch or stressed.`,
    stats.rainMmLogged
      ? `${stats.rainMmLogged.toFixed(1)} mm rain logged this week.`
      : "No rain gauge note this week — check the pond.",
    stats.harvestKg
      ? `${stats.harvestKg.toFixed(1)} kg harvest logged this week.`
      : "No harvest logged in 7 days.",
    stats.openTasks ? `${stats.openTasks} open tasks on the work list.` : "Work list is clear.",
  ];
  const domainBits = Object.entries(stats.weekByDomain)
    .filter(([, count]) => count > 0)
    .map(([domain, count]) => `${domain} ${count}`)
    .join(", ");
  if (domainBits) lines.push(`This week's notes: ${domainBits}.`);
  if (stats.notes[0]) lines.push(`Latest: ${stats.notes[0]}`);
  return lines.join("\n");
}

export async function buildBriefStats(): Promise<BriefStats> {
  const [dash, trees, recent, open] = await Promise.all([
    dashboardStats(),
    listTrees(),
    listObservations({ limit: 12 }),
    listTasks(false),
  ]);
  return {
    treeCount: dash.treeCount,
    watchCount: (dash.healthCounts.watch ?? 0) + (dash.healthCounts.stressed ?? 0),
    weekByDomain: dash.weekByDomain,
    rainMmLogged: dash.rainMmWeek,
    harvestKg: dash.harvestKgWeek,
    openTasks: open.length || dash.openTasks,
    notes: recent
      .map((row) => row.note)
      .filter((note): note is string => Boolean(note))
      .slice(0, 6),
    speciesWatch: trees
      .filter((tree) => tree.health === "watch" || tree.health === "stressed")
      .reduce<Record<string, number>>((acc, tree) => {
        acc[tree.species] = (acc[tree.species] ?? 0) + 1;
        return acc;
      }, {}),
  };
}

export async function generateFarmBrief(kind: "daily" | "weekly" = "weekly"): Promise<BriefRow> {
  const periodEnd = new Date();
  const days = kind === "daily" ? 1 : 7;
  const periodStart = new Date(periodEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const stats = await buildBriefStats();
  const weather = await getFarmWeather();
  const weatherLine = weather
    ? `${Math.round(weather.tempC ?? 0)}° ${weatherLabel(weather.code)} · week rain ${weather.weekRainMm?.toFixed(1) ?? "—"} mm (Open-Meteo).`
    : "Weather pause.";

  let markdown = templateBrief(stats, weatherLine);
  const profile = await getFarmProfile();
  const acres = profile.acres ? `${profile.acres} acres` : "this farm";
  const model = await geminiGenerateText(
    `You write a morning farm brief for ${profile.name}, ${acres} in ${profile.location.village || profile.location.address}.
Use ONLY these facts. Do not invent numbers, species, or weather.
6–10 short sentences. Local names in parentheses are welcome.
Facts JSON:\n${JSON.stringify({ weatherLine, stats })}`,
  );
  if (model?.trim()) markdown = model.trim();

  return insertBrief({
    kind,
    periodStart,
    periodEnd,
    markdown,
    stats,
  });
}

export async function currentBrief(kind: "daily" | "weekly" = "weekly") {
  const existing = await latestBrief(kind);
  const staleMs = kind === "daily" ? 20 * 60 * 60 * 1000 : 6 * 24 * 60 * 60 * 1000;
  if (existing && Date.now() - existing.createdAt.getTime() < staleMs) return existing;
  try {
    return await generateFarmBrief(kind);
  } catch {
    return existing;
  }
}
