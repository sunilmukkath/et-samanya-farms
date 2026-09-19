"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/Marks";
import { site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4">
        <Link href="/" onClick={() => setOpen(false)} className="min-w-0">
          <BrandLockup variant="ink" className="h-10 sm:h-12" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {site.nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "text-leaf underline-draw" : "hover:text-leaf"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/visit"
          className="hidden rounded-full bg-leaf-deep px-4 py-2 text-sm font-semibold text-cream md:inline-flex"
        >
          Enquire
        </Link>

        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className={`h-px w-4 bg-ink transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-ink transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-4 bg-ink transition ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-paper px-5 py-3 md:hidden">
          <nav className="flex flex-col">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-12 items-center text-base text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/visit"
              className="tap mt-2 flex items-center justify-center rounded-full bg-leaf-deep text-sm font-semibold text-cream"
              onClick={() => setOpen(false)}
            >
              Enquire
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
