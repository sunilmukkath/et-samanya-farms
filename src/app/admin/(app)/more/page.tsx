import { currentRole } from "@/lib/admin";
import type { AdminModule } from "@/lib/packs/types";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

type MoreLink = { href: string; label: string; hint: string; module: AdminModule | null };

const thisFarm: MoreLink[] = [
  { href: "/admin/books", label: "Accounts books", hint: "Cash, UPI, bills, and the day book", module: "ledger" as const },
  { href: "/admin/tasks", label: "Work list", hint: "What needs a walk", module: "tasks" as const },
  { href: "/admin/brief", label: "Weekly brief", hint: "What to check this week", module: "brief" as const },
  { href: "/admin/search", label: "Ask the notes", hint: "Talk or type — answers from your notes", module: null },
  { href: "/admin/season", label: "Season", hint: "Rain, harvest, planting windows", module: "season" as const },
  { href: "/admin/plots", label: "Plots", hint: "Named beds on the map", module: "plots" as const },
  { href: "/admin/stands", label: "Beds", hint: "Crop cycles on horticulture rows", module: "stands" as const },
  { href: "/admin/animals", label: "Animals", hint: "Herd as entities", module: "animals" as const },
  { href: "/admin/stay", label: "Stay", hint: "Occupancy history", module: "stay" as const },
];

const setup: MoreLink[] = [
  { href: "/admin/nodes", label: "Nodes", hint: "Pair sensors and watch live values", module: "nodes" as const },
  { href: "/admin/hardware", label: "4-acre kit", hint: "Phones first, then pond, soil, pump, rain", module: null },
  { href: "/admin/setup", label: "Farm setup", hint: "Name, packs, map pin, first node", module: null },
];

export default async function AdminMorePage() {
  const role = await currentRole();
  const runtime = await getRuntimeFarm();

  function shown(links: MoreLink[]) {
    return links.filter((link) => {
      if (link.href === "/admin/books" && role === "staff") return false;
      if (link.module && !runtime.modules.includes(link.module)) return false;
      return true;
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">{runtime.name}</h1>
      <p className="mt-2 text-sm text-ink-soft">This farm and the setup behind it.</p>

      <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">This farm</h2>
      <ul className="mt-2 space-y-2.5">
        {shown(thisFarm).map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="tap flex min-h-16 flex-col justify-center rounded-3xl border border-line bg-white px-5 py-3">
              <p className="font-display text-xl leading-tight sm:text-2xl">{link.label}</p>
              <p className="text-sm text-ink-soft">{link.hint}</p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Setup</h2>
      <ul className="mt-2 space-y-2.5 pb-4">
        {shown(setup).map((link) => (
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
