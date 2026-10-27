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

const guide: CatalogLink[] = [
  { href: "/admin/guide", label: "Field guide", hint: "Photo, zones, rain advice, voice, and water", module: null, find: "plantix disease ndvi yield weather voice irrigation garden diagnose" },
  { href: "/admin/weather", label: "Weather trends", hint: "Week, month, and year on this pin", module: null, find: "rain yoy month week climate weather" },
  { href: "/admin/search", label: "Ask the notes", hint: "Talk or type — answers from your notes", module: null, find: "ask search voice" },
  { href: "/admin/season", label: "Season", hint: "Rain, harvest, planting windows", module: "season", find: "rain weather year" },
];

const work: CatalogLink[] = [
  { href: "/admin/tasks", label: "Work list", hint: "What needs a walk", module: "tasks", find: "task jobs" },
  { href: "/admin/brief", label: "Weekly brief", hint: "What to check this week", module: "brief", find: "tony print" },
];

const land: CatalogLink[] = [
  { href: "/admin/map?walk=fence", label: "Walk the fence", hint: "GPS the outer perimeter. Acres come from that walk.", module: "map", find: "gps boundary acres fence tony" },
  { href: "/admin/map?count=1", label: "Count a section", hint: "Photograph a belt or bed. Confirm trees and plants.", module: "map", find: "census photo trees plants" },
  { href: "/admin/map", label: "Map", hint: "Trees, beds, and the fence on this land", module: "map", find: "gps walk outline" },
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
  { href: "/admin/setup", label: "Farm setup", hint: "Name and pin. The log works before this.", module: null, find: "onboard packs" },
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
    { id: "guide", title: "Guide", blurb: "A sick leaf, the rain record, and questions from the notes.", links: shown(guide) },
    { id: "work", title: "Work", blurb: "What to walk, and the note for the week.", links: shown(work) },
    { id: "land", title: "Land", blurb: "Map, beds, animals, and stay.", links: shown(land) },
    { id: "books", title: "Books", blurb: "Bills, the day book, and GST.", links: shown(books) },
    { id: "setup", title: "Setup", blurb: "Sensors, the kit list, and the farm pin.", links: shown(setup) },
  ].filter((group) => group.links.length);

  return <MoreDirectory farmName={runtime.name} groups={groups} denied={params.denied} />;
}
