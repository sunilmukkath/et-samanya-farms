import type { Metadata } from "next";
import Link from "next/link";
import { FarmPhoto } from "@/components/FarmPhoto";
import { journey, landUnits, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The farm",
  description:
    "Five acres of agroforestry: 1,600+ trees, a Sensei pond, solar irrigation, and ET Samanya Foods from the same land.",
};

export default function FarmPage() {
  return (
    <article>
      <header className="texture grain border-b border-line">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">The farm</p>
            <h1 className="mt-3 font-display text-5xl tracking-tight sm:text-6xl">
              Five acres, landscaped to get more out of the land.
            </h1>
          </div>
          <p className="max-w-md text-base leading-relaxed text-ink-soft">
            An integrated farm — trees, horticulture, solo crops, a pond, and
            paths — drawn with permaculture and vastu, not as a showpiece.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[2rem]">
          <FarmPhoto
            src="/photos/canopy.jpg"
            alt="Young trees standing on the farm"
            className="h-full min-h-72 w-full md:sticky md:top-28"
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-ink-soft">
          <p>
            We started this plot in {site.founded} on {site.acres} acres bought
            the November before. The work is agroforestry: trees with crops, so
            the farm feeds people and still holds a canopy.
          </p>
          <p>
            More than {site.treesPlanted.toLocaleString("en-IN")} trees are in
            the ground — timber, medicinal, and fruit — with a vegetable patch
            and solo crops of sesame, urad dal, and spinach. {site.legalName}{" "}
            is how nutritional food leaves the farm.
          </p>
          <p>
            <span className="font-tamil font-semibold text-leaf">சாமான்யம்</span>{" "}
            is ordinary food. The youth will deliver a meal to a door; fewer
            will grow it. This land is our answer to that.
          </p>
        </div>
      </div>

      <section className="border-y border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">The plot</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight">How the acres are used</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {landUnits.map((unit) => (
              <div key={unit.label} className="rounded-2xl border border-line bg-paper px-5 py-4">
                <p className="font-display text-3xl text-leaf-deep">{unit.share}</p>
                <p className="mt-1 text-sm text-ink-soft">{unit.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-3 px-5 pb-4 sm:px-8 md:grid-cols-2">
        <figure className="overflow-hidden rounded-[1.75rem] bg-cream">
          <FarmPhoto
            src="/photos/tending-vines.jpg"
            alt="Tending gourd vines on the farm"
            className="h-56 w-full"
            sizes="(min-width: 768px) 50vw, 100vw"
            width={768}
            height={1024}
          />
          <figcaption className="px-4 py-3 text-sm text-ink-soft">In the beds</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-[1.75rem] bg-cream">
          <FarmPhoto
            src="/photos/marigolds.jpg"
            alt="Marigolds in the horticulture patch"
            className="h-56 w-full"
            sizes="(min-width: 768px) 50vw, 100vw"
            width={1024}
            height={1024}
          />
          <figcaption className="px-4 py-3 text-sm text-ink-soft">Horticulture patch</figcaption>
        </figure>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Journey</p>
        <h2 className="mt-2 font-display text-4xl tracking-tight">From purchase to a living farm</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-5">
          {journey.map((step) => (
            <li key={step.year} className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-clay">{step.year}</p>
              <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-leaf-deep text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-[1.75rem]">
            <FarmPhoto
              src="/photos/pond.jpg"
              alt="The donut pond at sundown"
              className="h-72 w-full md:h-[22rem]"
              sizes="(min-width: 768px) 50vw, 100vw"
              width={1024}
              height={768}
            />
          </div>
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">Water</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight">Our Sensei pond</h2>
          <p className="mt-5 text-base leading-relaxed text-cream/85">
            A donut-shaped pond in the north-east corner, sixteen feet at its
            deepest. Inspired by Kurosawa&apos;s <em>Madadayo</em> — fish can
            swim one way without end. We named it for the teachers who still
            send us back to the land.
          </p>
          <p className="mt-4 text-base leading-relaxed text-cream/85">
            It holds water on the farm and lifts the water table. When it is
            full there are boats, visiting animals, a few fish, and — from
            December to February — a dip if you are brave about it.
          </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Where</p>
            <p className="mt-2 font-display text-2xl">{site.location.address}</p>
            <a
              href={site.location.mapsUrl}
              className="mt-3 inline-block text-sm font-semibold text-leaf underline-draw"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Company</p>
            <p className="mt-2 font-display text-2xl">{site.legalName}</p>
            <p className="mt-2 text-sm text-muted">CIN {site.cin}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Link href="/practices" className="font-semibold text-leaf underline-draw">
          Five principles that guide the work →
        </Link>
      </div>
    </article>
  );
}
