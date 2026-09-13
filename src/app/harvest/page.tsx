import type { Metadata } from "next";
import Link from "next/link";
import { FarmPhoto } from "@/components/FarmPhoto";
import { harvest } from "@/lib/site";

export const metadata: Metadata = {
  title: "Harvest",
  description:
    "Vegetables, spinach, sesame, urad dal, and fruit from a five-acre agroforestry farm.",
};

export default function HarvestPage() {
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

      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:px-8 md:grid-cols-2">
        {harvest.map((crop, index) => (
          <article
            key={crop.slug}
            className="overflow-hidden rounded-[1.75rem] border border-line bg-paper"
          >
            <FarmPhoto
              src={crop.photo}
              alt={crop.photoAlt}
              className="h-52 w-full"
              sizes="(min-width: 768px) 45vw, 100vw"
              width={crop.slug === "sesame" ? 460 : 1024}
              height={crop.slug === "sesame" ? 1024 : 420}
            />
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
          <h2 className="font-display text-4xl tracking-tight">From farm to table</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Fresh fruit and vegetables, and in time animal products and
            packaged food, leave this land as ET Samanya. What is ripe this
            week is the only honest catalogue.
          </p>
          <Link
            href="/visit"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-leaf px-6 font-semibold text-cream"
          >
            Ask for this week&apos;s list
          </Link>
        </div>
      </section>
    </article>
  );
}
