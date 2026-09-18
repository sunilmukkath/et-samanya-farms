import { currentRole } from "@/lib/admin";
import Link from "next/link";

const links = [
  { href: "/admin/brief", label: "Weekly brief", hint: "What to check this week" },
  { href: "/admin/tasks", label: "Work list", hint: "Derived from watch trees and stale logs" },
  { href: "/admin/search", label: "Ask the farm", hint: "Search notes and Tamil names" },
  { href: "/admin/season", label: "Season book", hint: "Rain, harvest, planting windows" },
  { href: "/admin/plots", label: "Plots", hint: "Named beds on the map" },
  { href: "/admin/animals", label: "Animals", hint: "Herd as entities" },
  { href: "/admin/ledger", label: "Ledger", hint: "Seed, labour, produce — operators" },
];

export default async function AdminMorePage() {
  const role = await currentRole();
  const shown = role === "staff" ? links.filter((link) => link.href !== "/admin/ledger") : links;

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-4xl">Farm OS</h1>
      <p className="mt-2 text-sm text-ink-soft">
        One timeline of observations. AI reads what you wrote — it does not guess the land.
      </p>
      <ul className="mt-6 space-y-3">
        {shown.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-3xl border border-line bg-white px-5 py-4">
              <p className="font-display text-2xl">{link.label}</p>
              <p className="text-sm text-ink-soft">{link.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
