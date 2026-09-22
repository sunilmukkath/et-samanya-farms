import { GuideAsk } from "@/components/admin/GuideAsk";
import { GuidePhoto } from "@/components/admin/GuidePhoto";
import { loadFieldGuide, resolveGuideScale, type ZoneBand } from "@/lib/guide";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

const bandLabel: Record<ZoneBand, string> = {
  strong: "Strong",
  mixed: "Mixed",
  thin: "Thin",
  empty: "No notes",
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ scale?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getRuntimeFarm();
  const scale = resolveGuideScale(params.scale, runtime.acres);
  const guide = await loadFieldGuide(scale);

  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-10">
      <p className="font-tamil text-sm text-muted">{scale === "home" ? "வீட்டுத் தோட்டம்" : "வயல் வழிகாட்டி"}</p>
      <h1 className="font-display text-4xl leading-none">Field guide</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {scale === "home"
          ? "A sick pot, a dry saucer, and a spoken question — sized for a balcony or a kitchen bed."
          : `${guide.place}. A sick leaf, a weak patch, the week’s rain, and whether to water.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/guide?scale=farm" className="admin-chip" data-on={scale === "farm" ? "true" : "false"}>
          This farm
        </Link>
        <Link href="/admin/guide?scale=home" className="admin-chip" data-on={scale === "home" ? "true" : "false"}>
          Home garden
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">See the leaf</h2>
        <p className="mt-1 text-sm text-ink-soft">Photograph a pest, a disease, or a pale leaf. You confirm before anything is saved.</p>
        <div className="mt-3">
          <GuidePhoto />
        </div>
        {guide.issues.length ? (
          <ul className="mt-3 space-y-2">
            {guide.issues.map((issue) => (
              <li key={issue.id} className="rounded-[1.25rem] bg-white px-4 py-3 text-sm shadow-[var(--shadow)]">
                <p className="font-semibold">
                  {issue.crop}
                  {issue.cause ? ` · ${issue.cause}` : ""} · {issue.when}
                </p>
                <p className="mt-1 text-ink-soft">
                  {issue.issue}
                  {issue.step ? ` Next: ${issue.step}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Field zones</h2>
        <p className="mt-1 text-sm text-ink-soft">{guide.satelliteLine}</p>
        <ul className="mt-3 space-y-2">
          {guide.zones.map((zone) => (
            <li key={zone.id} className="rounded-[1.25rem] bg-white px-4 py-3 shadow-[var(--shadow)]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{zone.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {bandLabel[zone.band]}
                  {zone.score != null ? ` ${zone.score}` : ""}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{zone.detail}</p>
              <p className="mt-1 text-sm">{zone.action}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Crop outlook</h2>
        <ul className="mt-3 space-y-2">
          {guide.outlook.map((row) => (
            <li key={row.crop} className="rounded-[1.25rem] bg-white px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow)]">
              {row.line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-leaf-deep px-5 py-5 text-cream">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-sun">Today’s advice</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {guide.advisories.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-sand">{guide.marketLine}</p>
        <a href="https://agmarknet.gov.in/" className="mt-2 inline-block text-sm font-semibold text-sun">
          Agmarknet prices
        </a>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Ask aloud</h2>
        <p className="mt-1 mb-3 text-sm text-ink-soft">Tamil, Hindi, or English. The answer uses this guide and your notes.</p>
        <GuideAsk scale={scale} />
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Water</h2>
        <ul className="mt-3 space-y-2">
          {guide.water.map((call) => (
            <li key={`${call.title}-${call.detail}`} className="rounded-[1.25rem] bg-white px-4 py-3 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{call.tone}</p>
              <p className="mt-1 font-semibold">{call.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{call.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
