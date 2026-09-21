import { MoreDirectory, type MoreGroup } from "@/components/admin/MoreDirectory";
import { currentRole } from "@/lib/admin";
import type { AdminModule } from "@/lib/packs/types";
import { getRuntimeFarm } from "@/lib/profile";

type CatalogLink = {
  href: string;
  label: string;
  hint: string;
  module: AdminModule | null;
  find?: string;
};

const today: CatalogLink[] = [
  { href: "/admin/tasks", label: "Work list", hint: "What needs a walk", module: "tasks", find: "task jobs" },
  { href: "/admin/brief", label: "Weekly brief", hint: "What to check this week", module: "brief", find: "tony print" },
  { href: "/admin/search", label: "Ask the notes", hint: "Talk or type — answers from your notes", module: null, find: "ask search voice" },
  { href: "/admin/season", label: "Season", hint: "Rain, harvest, planting windows", module: "season", find: "rain weather year" },
];

const land: CatalogLink[] = [
  { href: "/admin/map", label: "Map", hint: "Trees, beds, and nodes on this land", module: "map", find: "gps walk outline" },
  { href: "/admin/plots", label: "Plots", hint: "Named beds on the map", module: "plots" },
  { href: "/admin/stands", label: "Beds", hint: "Crop cycles on horticulture rows", module: "stands", find: "plants horticulture" },
  { href: "/admin/animals", label: "Animals", hint: "Herd as entities", module: "animals", find: "cattle feed" },
  { href: "/admin/stay", label: "Stay", hint: "Occupancy history", module: "stay", find: "guests farm stay" },
];

const books: CatalogLink[] = [
  { href: "/admin/books", label: "Day book", hint: "Cash, bank, UPI — this Indian FY", module: "ledger", find: "gst gstin pan money ledger finance books" },
  { href: "/admin/books/new", label: "New bill", hint: "Photo, SMS, or type a voucher", module: "ledger", find: "gst invoice receipt bill" },
  { href: "/admin/books/reports", label: "Reports", hint: "P&L and GST for the CA", module: "ledger", find: "gst itr profit loss" },
];

const setup: CatalogLink[] = [
  { href: "/admin/nodes", label: "Nodes", hint: "Pair sensors and watch live values", module: "nodes", find: "pump mqtt sensor" },
  { href: "/admin/hardware", label: "4-acre kit", hint: "Phones first, then pond, soil, pump, rain", module: null, find: "lora kit" },
  { href: "/admin/setup", label: "Farm setup", hint: "Name, packs, map pin, first node", module: null, find: "onboard packs" },
];

export default async function AdminMorePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  const role = await currentRole();
  const runtime = await getRuntimeFarm();

  function shown(links: CatalogLink[]) {
    return links.filter((link) => {
      if (link.module === "ledger" && role === "staff") return false;
      if (link.module && !runtime.modules.includes(link.module)) return false;
      return true;
    });
  }

  const groups: MoreGroup[] = [
    { id: "today", title: "Today", links: shown(today) },
    { id: "land", title: "On the land", links: shown(land) },
    { id: "books", title: "Books", links: shown(books) },
    { id: "setup", title: "Setup", links: shown(setup) },
  ].filter((group) => group.links.length);

  return <MoreDirectory farmName={runtime.name} groups={groups} denied={params.denied} />;
}
