import { currentRole } from "@/lib/admin";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

const catalog = [
  { href: "/admin/stay", label: "Farm stay", hint: "Private occupancy notes", module: "stay" as const },
  { href: "/admin/brief", label: "Weekly brief", hint: "What to check this week", module: "brief" as const },
  { href: "/admin/tasks", label: "Work list", hint: "Derived from logs, nodes, and rules", module: "tasks" as const },
  { href: "/admin/search", label: "Ask the farm", hint: "Talk or type — answers from your notes", module: null },
  { href: "/admin/season", label: "Season book", hint: "Rain, harvest, planting windows", module: "season" as const },
  { href: "/admin/plots", label: "Plots", hint: "Named beds on the map", module: "plots" as const },
  { href: "/admin/stands", label: "Beds / crop cycles", hint: "Horticulture stands", module: "stands" as const },
  { href: "/admin/animals", label: "Animals", hint: "Herd as entities", module: "animals" as const },
  { href: "/admin/nodes", label: "Nodes", hint: "Sensors, live values, OTA", module: "nodes" as const },
  { href: "/admin/ledger", label: "Ledger", hint: "Seed, labour, produce — operators", module: "ledger" as const },
  { href: "/admin/setup", label: "Farm setup", hint: "Packs, biome, map pin", module: null },
];

export default async function AdminMorePage() {
  const role = await currentRole();
  const runtime = await getRuntimeFarm();
  const shown = catalog.filter((link) => {
    if (link.href === "/admin/ledger" && role === "staff") return false;
    if (link.module && !runtime.modules.includes(link.module)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Farm OS</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {runtime.name}. Packs on: {runtime.enabledPacks.join(", ")}.
      </p>
      <ul className="mt-5 space-y-2.5 pb-4">
        {shown.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="tap flex min-h-16 flex-col justify-center rounded-3xl border border-line bg-white px-5 py-3">
              <p className="font-display text-xl leading-tight sm:text-2xl">{link.label}</p>
              <p className="text-sm text-ink-soft">{link.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
