"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminModule } from "@/lib/packs/types";

export type MoreLink = {
  href: string;
  label: string;
  hint: string;
  module: AdminModule | null;
  find?: string;
};

export type MoreGroup = {
  id: string;
  title: string;
  links: MoreLink[];
};

export function MoreDirectory({
  farmName,
  groups,
  denied,
}: {
  farmName: string;
  groups: MoreGroup[];
  denied?: string;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return groups.filter((group) => group.links.length);
    return groups
      .map((group) => ({
        ...group,
        links: group.links.filter((link) => {
          const hay = `${link.label} ${link.hint} ${link.find ?? ""} ${group.title}`.toLowerCase();
          return hay.includes(needle);
        }),
      }))
      .filter((group) => group.links.length);
  }, [groups, needle]);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">{farmName}</h1>
      <p className="mt-2 text-sm text-ink-soft">Find work, land, books, and setup.</p>

      {denied === "books" ? (
        <p className="mt-4 rounded-[1.25rem] bg-cream px-4 py-3 text-sm">
          Books is for operators. Ask one of them for GST, bills, and the day book.
        </p>
      ) : null}

      <label className="mt-5 block">
        <span className="sr-only">Find</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find: rain, stay, books…"
          className="tap w-full rounded-2xl border border-line bg-white px-4 text-base"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing matches. Try stay, ask, or gst.</p>
      ) : (
        filtered.map((group) => (
          <section key={group.id} className="mt-7">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{group.title}</h2>
            <ul className="mt-2 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="tap flex min-h-16 flex-col justify-center rounded-3xl border border-line bg-white px-5 py-3"
                  >
                    <p className="font-display text-xl leading-tight sm:text-2xl">{link.label}</p>
                    <p className="text-sm text-ink-soft">{link.hint}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
