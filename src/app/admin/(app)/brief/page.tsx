import { refreshBriefAction } from "@/app/admin/actions";
import { ShareBrief } from "@/components/admin/ShareBrief";
import { canPersistFarmData } from "@/db/queries";
import { currentBrief } from "@/lib/brief";
import { timeAgo } from "@/lib/farm";
import Link from "next/link";

export default async function BriefPage() {
  const persist = canPersistFarmData();
  const brief = persist ? await currentBrief("weekly").catch(() => null) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Weekly brief</h1>
      <p className="admin-no-print mt-2 text-sm text-ink-soft">
        Built from your logs and Open-Meteo. Gemini only rewrites the facts you already saved. Print or share so Tony
        can read it without opening the log.
      </p>
      {brief ? (
        <article className="brief-print mt-5 whitespace-pre-line rounded-3xl border border-line bg-white px-5 py-5 text-base leading-relaxed">
          {brief.markdown}
        </article>
      ) : (
        <p className="mt-5 rounded-3xl border border-line bg-white px-5 py-6 text-sm text-ink-soft">
          Save a few notes this week, then refresh the brief.{" "}
          <Link href="/admin/log" className="font-semibold text-leaf-deep">
            Log
          </Link>
        </p>
      )}
      {brief ? (
        <p className="admin-no-print mt-3 text-xs text-muted">Updated {timeAgo(brief.createdAt)}</p>
      ) : null}
      {brief ? <ShareBrief markdown={brief.markdown} /> : null}
      <form action={refreshBriefAction} className="admin-no-print mt-3">
        <button type="submit" className="tap rounded-full border border-line bg-white px-5 text-sm font-semibold">
          Refresh brief
        </button>
      </form>
    </div>
  );
}

