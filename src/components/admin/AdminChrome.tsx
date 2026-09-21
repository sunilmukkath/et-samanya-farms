"use client";

import { BrandLockup } from "@/components/Marks";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminTab = {
  href: string;
  label: string;
  icon: "home" | "map" | "log" | "more";
};

export function AdminHeader({
  roleLabel,
  farmName,
  signOut,
}: {
  roleLabel?: string | null;
  farmName?: string;
  signOut: () => Promise<void>;
}) {
  return (
    <header className="admin-no-print z-30 shrink-0 border-b border-white/10 bg-leaf-deep pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-12 max-w-xl items-center gap-2 px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2">
          <BrandLockup variant="white" className="h-7" />
          <p className="truncate font-display text-base leading-none text-cream">
            {farmName ?? "Farm log"}
            {roleLabel ? (
              <span className="ml-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-sun">
                {roleLabel}
              </span>
            ) : null}
          </p>
        </Link>
        <form action={signOut}>
          <button type="submit" className="tap min-w-12 rounded-full px-3 text-sm font-semibold text-cream">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

export function AdminTabBar({ tabs }: { tabs: AdminTab[] }) {
  const path = usePathname();

  return (
    <nav className="admin-no-print z-30 shrink-0 border-t border-white/10 bg-leaf-deep pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="mx-auto grid max-w-xl grid-cols-4 text-center">
        {tabs.map((tab) => {
          const on = tabIsOn(tab.href, path);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-on={on ? "true" : "false"}
              className="admin-tab tap flex-col gap-0.5 px-1 py-1.5 text-xs font-semibold leading-none"
            >
              <TabGlyph name={tab.icon} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function tabIsOn(href: string, path: string) {
  if (href === "/admin") return path === "/admin";
  if (href === "/admin/log") {
    return path === "/admin/log" || path.startsWith("/admin/log/") || path.startsWith("/admin/logs");
  }
  if (href === "/admin/more") {
    return (
      path.startsWith("/admin") &&
      path !== "/admin" &&
      !path.startsWith("/admin/map") &&
      !path.startsWith("/admin/log") &&
      !path.startsWith("/admin/logs")
    );
  }
  return path === href || path.startsWith(`${href}/`) || path.startsWith(`${href}?`);
}

function TabGlyph({ name }: { name: AdminTab["icon"] }) {
  const common = "h-5 w-5";
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "map") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="11" r="1.8" fill="currentColor" />
      </svg>
    );
  }
  if (name === "log") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  );
}
