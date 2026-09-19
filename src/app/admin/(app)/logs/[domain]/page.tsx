import { LogHistory } from "@/components/admin/LogHistory";
import { LogNav } from "@/components/admin/LogNav";
import { listObservations } from "@/db/queries";
import { isObservationDomain } from "@/lib/farm";
import { groupForDomain } from "@/lib/packs/groups";
import { getRuntimeFarm } from "@/lib/profile";
import { notFound } from "next/navigation";

export default async function DomainLogPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const runtime = await getRuntimeFarm();
  if (!isObservationDomain(domain) || !runtime.domainBySlug[domain]) notFound();
  const rows = await listObservations({ domain, limit: 60 });
  const group = groupForDomain(domain);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <LogNav
        currentDomain={domain}
        currentGroup={group}
        view="past"
        domains={runtime.domains}
        hasDomainParam
      />
      <LogHistory rows={rows} domain={domain} farmName={runtime.shortName} />
    </div>
  );
}
