import type { Metadata } from "next";
import Link from "next/link";
import { FarmPhoto } from "@/components/FarmPhoto";
import { listRecentHarvest } from "@/db/queries";
import { isPublicHarvestEnabled, timeAgo } from "@/lib/farm";
import { gallery, harvest } from "@/lib/site";

export const metadata: Metadata = {
  title: "Harvest",
  description:
    "Vegetables, spinach, sesame, urad dal, and fruit from a five-acre agroforestry farm.",
};

export default async function HarvestPage() {
  const fromLog =
    isPublicHarvestEnabled()
      ? await listRecentHarvest(14).catch(() => [])
      : [];
  const thisWeek = fromLog.filter((row) => row.details?.crop);

  return (
    <article>
      <header className="texture grain border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Harvest</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl tracking-tight sm:text-6xl">
            Fresh food from the same plot as the trees.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Horticulture and solo crops among 1,600 trees. ET Samanya is how
            that food reaches people. Ask for this week&apos;s list — the beds
            change with the season.
          </p>
        </div>
      </header>

      {thisWeek.length ? (
        <section className="border-b border-line bg-cream">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">This week from the log</p>
            <h2 className="mt-2 font-display text-4xl tracking-tight">What came off the land</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {thisWeek.slice(0, 8).map((row) => (
                <li key={row.id} className="rounded-[1.5rem] border border-line bg-paper px-5 py-4">
                  <p className="font-display text-2xl">{row.details?.crop}</p>
                  <p className="text-sm text-ink-soft">
                    {row.details?.quantity != null
                      ? `${row.details.quantity} ${row.details.unit ?? ""}`.trim()
                      : "Picked"}
                    {row.details?.destination ? ` · ${row.details.destination}` : ""}
                    {` · ${timeAgo(row.occurredAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:px-8 md:grid-cols-2">
        {harvest.map((crop, index) => (
          <article
            key={crop.slug}
            className="overflow-hidden rounded-[1.75rem] border border-line bg-paper"
          >
            {"photo" in crop && crop.photo ? (
              <FarmPhoto
                src={crop.photo}
                alt={crop.photoAlt}
                className="h-52 w-full"
                sizes="(min-width: 768px) 45vw, 100vw"
              />
            ) : null}
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {String(index + 1).padStart(2, "0")} · {crop.season}
              </p>
              <h2 className="mt-3 font-display text-3xl">{crop.name}</h2>
              <p className="font-tamil mt-1 text-clay">{crop.tamil}</p>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">{crop.note}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="border-t border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">On the land</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight">From this season</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((shot) => (
              <figure key={shot.src} className="overflow-hidden rounded-[1.5rem] bg-paper">
                <FarmPhoto
                  src={shot.src}
                  alt={shot.alt}
                  className="h-48 w-full"
                  sizes="(min-width: 1024px) 30vw, 90vw"
                  width={1024}
                  height={768}
                />
                <figcaption className="px-4 py-3 text-sm text-ink-soft">{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="font-display text-4xl tracking-tight">From farm to table</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Fresh fruit and vegetables, and in time animal products and
            packaged food, leave this land as ET Samanya. What is ripe this
            week is the only honest catalogue.
          </p>
          <Link
            href="/visit"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-leaf-deep px-6 font-semibold text-cream"
          >
            Ask for this week&apos;s list
          </Link>
        </div>
      </section>
    </article>
  );
}
