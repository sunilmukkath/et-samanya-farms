"use client";

import { BrandLockup } from "@/components/Marks";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/admin",
    label: "Home",
    match: (path: string) =>
      path === "/admin" ||
      (!path.startsWith("/admin/map") && !path.startsWith("/admin/log") && !path.startsWith("/admin/stay")),
  },
  { href: "/admin/map", label: "Map", match: (path: string) => path.startsWith("/admin/map") },
  { href: "/admin/stay", label: "Farm stay", match: (path: string) => path.startsWith("/admin/stay") },
  { href: "/admin/log", label: "Farm log", match: (path: string) => path.startsWith("/admin/log") },
];

export function AdminHeader({
  roleLabel,
  signOut,
}: {
  roleLabel?: string | null;
  signOut: () => Promise<void>;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-leaf-deep/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2">
        <Link href="/admin" className="min-w-0 flex-1">
          <BrandLockup variant="white" className="h-8 sm:h-8" />
          <p className="mt-0.5 truncate font-display text-lg leading-none text-cream">
            Farm log
            {roleLabel ? <span className="ml-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-sun">{roleLabel}</span> : null}
          </p>
        </Link>
        <Link href="/" className="hidden text-xs font-semibold text-sand sm:inline">
          Public site
        </Link>
        <form action={signOut}>
          <button type="submit" className="tap px-2 text-sm font-semibold text-cream">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

export function AdminTabBar() {
  const path = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/10 bg-leaf-deep pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-xl grid-cols-4 text-center text-xs font-semibold sm:text-sm">
        {tabs.map((tab) => {
          const on = tab.match(path);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-on={on ? "true" : "false"}
              className="admin-tab tap px-1 leading-tight"
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
