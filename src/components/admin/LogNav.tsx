"use client";

import type { ObservationDomain } from "@/db/schema";
import {
  defaultDomainForGroup,
  groupForDomain,
  groupsFor,
  type CaptureGroupId,
} from "@/lib/packs/groups";
import type { DomainDef } from "@/lib/packs/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LAST_DOMAIN = "farm-log-last-domain";
const LAST_GROUP = "farm-log-last-group";
const LOG_HINT = "farm-log-chip-hint-dismissed";

export function LogNav({
  currentDomain,
  currentGroup,
  view,
  domains,
  hasDomainParam,
}: {
  currentDomain?: ObservationDomain;
  currentGroup: CaptureGroupId;
  view: "new" | "past";
  domains: DomainDef[];
  hasDomainParam: boolean;
}) {
  const router = useRouter();
  const groups = groupsFor(domains);
  const active = groups.find((group) => group.id === currentGroup);
  const showSubs = currentGroup === "crop" || currentGroup === "more";
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(LOG_HINT) === "1") setShowHint(false);
  }, []);

  useEffect(() => {
    if (!hasDomainParam) {
      const last = localStorage.getItem(LAST_DOMAIN);
      const lastGroup = localStorage.getItem(LAST_GROUP);
      if (last && domains.some((item) => item.slug === last)) {
        const qs = new URLSearchParams({ domain: last, group: lastGroup || groupForDomain(last as ObservationDomain) });
        if (view === "past") qs.set("view", "past");
        router.replace(`/admin/log?${qs}`);
      }
      return;
    }
    if (currentDomain) {
      localStorage.setItem(LAST_DOMAIN, currentDomain);
      localStorage.setItem(LAST_GROUP, currentGroup);
    }
  }, [currentDomain, currentGroup, domains, hasDomainParam, router, view]);

  function href(next: { group?: CaptureGroupId; domain?: string; view?: "new" | "past" }) {
    const group = next.group ?? currentGroup;
    const domain =
      next.domain ??
      (next.group && next.group !== currentGroup
        ? defaultDomainForGroup(next.group, domains, currentDomain)
        : currentDomain);
    const nextView = next.view ?? view;
    const qs = new URLSearchParams();
    if (domain) qs.set("domain", domain);
    qs.set("group", group);
    if (nextView === "past") qs.set("view", "past");
    return `/admin/log?${qs}`;
  }

  return (
    <div>
      <div className="admin-fade-x sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-paper/95 px-4 py-2 backdrop-blur">
        {groups.map((group) => (
          <a
            key={group.id}
            href={href({ group: group.id, domain: defaultDomainForGroup(group.id, domains, currentDomain) ?? undefined, view: "new" })}
            data-on={currentGroup === group.id ? "true" : "false"}
            className="admin-chip shrink-0"
          >
            {group.label}
          </a>
        ))}
      </div>
      {showSubs && active?.domains.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {active.domains.map((slug) => {
            const meta = domains.find((item) => item.slug === slug);
            return (
              <a
                key={slug}
                href={href({ group: currentGroup, domain: slug })}
                data-on={currentDomain === slug ? "true" : "false"}
                className="admin-chip"
              >
                {meta?.label ?? slug}
              </a>
            );
          })}
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={href({ view: "new" })}
          data-on={view === "new" ? "true" : "false"}
          className="admin-chip tap flex items-center justify-center"
        >
          New
        </a>
        <a
          href={href({ view: "past" })}
          data-on={view === "past" ? "true" : "false"}
          className="admin-chip tap flex items-center justify-center"
        >
          Past
        </a>
      </div>
      {showHint ? (
        <p className="mt-3 flex items-start justify-between gap-3 rounded-[1.25rem] bg-cream px-4 py-3 text-sm text-ink">
          <span>Note = photo or voice. Water = rain gauge. Crop = beds and pick.</span>
          <button
            type="button"
            className="tap shrink-0 px-2 text-sm font-semibold text-leaf-deep"
            onClick={() => {
              localStorage.setItem(LOG_HINT, "1");
              setShowHint(false);
            }}
          >
            Got it
          </button>
        </p>
      ) : null}
    </div>
  );
}
