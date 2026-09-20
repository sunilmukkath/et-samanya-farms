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
import { useEffect } from "react";

const LAST_DOMAIN = "farm-log-last-domain";
const LAST_GROUP = "farm-log-last-group";

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
      <div className="sticky top-0 z-20 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-1.5">
          {groups.map((group) => (
            <a
              key={group.id}
              href={href({ group: group.id, domain: defaultDomainForGroup(group.id, domains, currentDomain) ?? undefined, view: "new" })}
              data-on={currentGroup === group.id ? "true" : "false"}
              className="admin-chip min-h-10 justify-center px-2 text-sm"
            >
              {group.label}
            </a>
          ))}
        </div>
      </div>
      {showSubs && active?.domains.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {active.domains.map((slug) => {
            const meta = domains.find((item) => item.slug === slug);
            return (
              <a
                key={slug}
                href={href({ group: currentGroup, domain: slug })}
                data-on={currentDomain === slug ? "true" : "false"}
                className="admin-chip min-h-10 justify-center px-3 text-sm"
              >
                {meta?.label ?? slug}
              </a>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <a
          href={href({ view: "new" })}
          data-on={view === "new" ? "true" : "false"}
          className="admin-chip tap flex min-h-10 items-center justify-center text-sm"
        >
          New
        </a>
        <a
          href={href({ view: "past" })}
          data-on={view === "past" ? "true" : "false"}
          className="admin-chip tap flex min-h-10 items-center justify-center text-sm"
        >
          Past
        </a>
      </div>
    </div>
  );
}
