import Link from "next/link";
import { FarmPhoto } from "@/components/FarmPhoto";
import { aims, gallery, harvest, practices, site } from "@/lib/site";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <FarmPhoto
            src="/photos/pond.jpg"
            alt="The donut pond at sundown"
            className="h-full w-full"
            sizes="100vw"
            width={1024}
            height={768}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/92 to-paper/55" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div className="rise max-w-xl">
            <p className="font-tamil text-sm font-semibold tracking-wide text-clay">
              சாமான்யம் · grow our own food
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
              A little earth.
              <span className="block text-leaf">A lot of heart.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Five acres. More than {site.treesPlanted.toLocaleString("en-IN")}{" "}
              trees, a vegetable patch, sesame, urad, spinach — and a pond that
              holds the water on this land.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/farm"
                className="inline-flex h-12 items-center rounded-full bg-leaf-deep px-6 font-semibold text-cream"
              >
                See the farm
              </Link>
              <Link
                href="/visit"
                className="inline-flex h-12 items-center rounded-full border border-line px-6 font-semibold text-ink"
              >
                Visit or enquire
              </Link>
            </div>
          </div>
          <div className="rise-delay relative hidden overflow-hidden rounded-[2rem] md:block md:min-h-[380px]">
            <FarmPhoto
              src="/photos/palm-seedling.jpg"
              alt="A young palm on the farm at dusk"
              className="h-full min-h-[380px] w-full"
              sizes="40vw"
              width={768}
              height={1024}
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">The aim</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              We want to grow our own food.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              {site.slogan}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {aims.map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-xl text-leaf-deep">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">From the plot</p>
            <h2 className="mt-2 font-display text-4xl tracking-tight">What we grow</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {harvest
            .filter((crop) => crop.slug === "vegetables" || crop.slug === "sesame" || crop.slug === "fruit")
            .map((crop) => (
            <Link
              key={crop.slug}
              href="/harvest"
              className="group overflow-hidden rounded-3xl border border-line bg-paper transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
            >
              {"photo" in crop && crop.photo ? (
                <FarmPhoto
                  src={crop.photo}
                  alt={crop.photoAlt}
                  className="h-44 w-full"
                  sizes="(min-width: 1024px) 30vw, 90vw"
                />
              ) : null}
              <div className="p-5">
                <p className="font-tamil text-sm text-clay">{crop.tamil}</p>
                <h3 className="mt-1 font-display text-2xl">{crop.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{crop.season}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{crop.note}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/harvest" className="mt-8 inline-flex font-semibold text-leaf underline-draw">
          Full harvest list
        </Link>
      </section>

      <section className="bg-leaf-deep text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem]">
            <FarmPhoto
              src="/photos/mango-sapling.jpg"
              alt="A young sapling on the farm"
              className="h-72 w-full md:h-[22rem]"
              sizes="(min-width: 768px) 40vw, 100vw"
              width={768}
              height={1024}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">How we farm</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight">Agroforestry. A living balance.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
              Trees with crops. A donut pond in the north-east. Solar drip.
              The land is zoned so food, water, animals, and people fit on
              the same five acres.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {practices.slice(0, 4).map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-xl text-sand">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/80">{item.body}</p>
                </div>
              ))}
            </div>
            <Link
              href="/practices"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-sun px-6 font-semibold text-soil"
            >
              Five principles
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">On the land</p>
        <h2 className="mt-2 font-display text-4xl tracking-tight">From this season</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((shot) => (
            <figure key={shot.src} className="overflow-hidden rounded-[1.5rem] bg-cream">
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
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="rounded-[2rem] bg-cream px-6 py-12 sm:px-12">
          <p className="font-tamil text-sm font-semibold text-clay">வாருங்கள்</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Interested in growing your food?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Walk the plot, ask for this week&apos;s produce, or sit by the pond
            when it is full. We farm first, host second.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/visit"
              className="inline-flex h-12 items-center rounded-full bg-clay px-6 font-semibold text-paper"
            >
              Enquire
            </Link>
            <a
              href={site.phoneHref}
              className="inline-flex h-12 items-center rounded-full border border-line px-6 font-semibold"
            >
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
