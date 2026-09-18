import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-leaf-deep text-cream">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-leaf-deep/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
          <Link href="/admin" className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sun">Samanya</p>
            <p className="truncate font-display text-xl leading-tight">Farm log</p>
          </Link>
          <Link href="/admin/map" className="tap inline-flex items-center rounded-full px-3 text-sm font-semibold text-cream">
            Map
          </Link>
          <Link href="/admin/log" className="tap inline-flex items-center rounded-full bg-leaf px-4 text-sm font-semibold text-leaf-deep">
            Log
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="tap px-2 text-xs text-sand">
              Out
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 bg-paper text-ink">{children}</div>
      <nav className="sticky bottom-0 z-30 border-t border-white/10 bg-leaf-deep pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-3xl grid-cols-4 text-center text-xs font-semibold text-sand">
          <Link href="/admin" className="tap py-3 hover:text-cream">
            Home
          </Link>
          <Link href="/admin/map" className="tap py-3 hover:text-cream">
            Trees
          </Link>
          <Link href="/admin/log" className="tap py-3 hover:text-cream">
            Note
          </Link>
          <Link href="/" className="tap py-3 hover:text-cream">
            {site.shortName}
          </Link>
        </div>
      </nav>
    </div>
  );
}
