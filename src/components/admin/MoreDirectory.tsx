"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminModule } from "@/lib/packs/types";

const CATEGORY_KEY = "farm-more-category";

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
  blurb: string;
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
  const [selected, setSelected] = useState(groups[0]?.id ?? "");
  const needle = query.trim().toLowerCase();
  const available = groups.filter((group) => group.links.length);
  const categoryIds = available.map((group) => group.id).join("|");

  useEffect(() => {
    const saved = localStorage.getItem(CATEGORY_KEY);
    if (saved && categoryIds.split("|").includes(saved)) setSelected(saved);
  }, [categoryIds]);

  const filtered = useMemo(() => {
    if (!needle) return available;
    return available
      .map((group) => ({
        ...group,
        links: group.links.filter((link) => {
          const hay = `${link.label} ${link.hint} ${link.find ?? ""} ${group.title}`.toLowerCase();
          return hay.includes(needle);
        }),
      }))
      .filter((group) => group.links.length);
  }, [available, needle]);

  const openId = available.some((group) => group.id === selected) ? selected : available[0]?.id;
  const visible = needle ? filtered : filtered.filter((group) => group.id === openId);

  function choose(id: string) {
    setSelected(id);
    localStorage.setItem(CATEGORY_KEY, id);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">{farmName}</h1>
      <p className="mt-2 text-sm text-ink-soft">Pick a category, or search across all of them.</p>

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

      {needle ? null : (
        <div className="admin-fade-x mt-4 flex gap-2 overflow-x-auto pb-1">
          {available.map((group) => (
            <button
              key={group.id}
              type="button"
              className="admin-chip shrink-0"
              data-on={group.id === openId ? "true" : "false"}
              onClick={() => choose(group.id)}
            >
              {group.title}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing matches. Try stay, ask, or gst.</p>
      ) : (
        visible.map((group) => (
          <section key={group.id} className="mt-6">
            <h2 className="font-display text-2xl">{group.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{group.blurb}</p>
            <ul className="mt-3 space-y-2.5">
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
