import type { Metadata } from "next";
import Link from "next/link";
import { FarmPhoto } from "@/components/FarmPhoto";
import { practices } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practices",
  description:
    "Five principles of the farm: design, soil and water, agroforestry, nutrient cycling, and learning with the village.",
};

export default function PracticesPage() {
  return (
    <article>
      <header className="bg-leaf-deep text-cream">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">Practices</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-tight sm:text-6xl">
            Agroforestry is how we keep a balance.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/80">
            Trees with crops or cattle can feed the soil, store carbon, and
            still put fruit, nuts, and timber on the books. We use
            permaculture and vastu so the plot works as one system.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
          Five principles that guide the work
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {practices.map((item, index) => (
            <section key={item.title} className="rounded-[1.75rem] border border-line p-8">
              <p className="text-sm font-semibold text-clay">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 font-display text-3xl text-leaf-deep">{item.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">{item.body}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="border-y border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <div className="overflow-hidden rounded-[1.75rem]">
            <FarmPhoto
              src="/photos/solar.jpg"
              alt="Solar panels standing on the farm"
              className="h-[22rem] w-full"
              width={1024}
              height={768}
              sizes="(min-width: 768px) 35vw, 100vw"
            />
          </div>
          <div className="space-y-8">
          <section>
            <h2 className="font-display text-3xl">Solar pump and drip</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              Irrigation is solar. Water is placed where the trees and beds
              need it — not flooded across the plot because the pump is on.
            </p>
          </section>
          <section>
            <h2 className="font-display text-3xl">Zoning</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              Natural fencing of palm and arecanut. Fruit closer in. Trees and
              open ground further out. Animal enclosures and a farmhouse as
              the stay-and-store heart. A picnic edge on the pond&apos;s
              twenty-five metre radius.
            </p>
          </section>
          <div className="overflow-hidden rounded-[1.25rem]">
            <FarmPhoto
              src="/photos/compost.jpg"
              alt="Compost heaped on a sheet in the field"
              className="h-40 w-full"
              width={1024}
              height={460}
              sizes="(min-width: 768px) 35vw, 100vw"
            />
          </div>
          <Link href="/visit" className="inline-flex font-semibold text-leaf underline-draw">
            Visit the fields or call us →
          </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
