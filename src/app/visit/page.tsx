import type { Metadata } from "next";
import { EnquireForm } from "@/components/EnquireForm";
import { FarmPhoto } from "@/components/FarmPhoto";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visit & enquire",
  description:
    "Enquire about this week’s harvest, kitchen supply, or a visit to ET Samanya Farms.",
};

export default function VisitPage() {
  const { lat, lng, mapsUrl, address, village } = site.location;
  const mapSrc = `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

  return (
    <article>
      <header className="texture grain border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Visit & enquire</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl tracking-tight sm:text-6xl">
            Interested in growing your food?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Walks, workshops, and this week&apos;s produce — by arrangement. We
            farm first, host second. December to February is when the pond is
            at its best.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div>
          <div className="mb-8 overflow-hidden rounded-[1.75rem]">
            <FarmPhoto
              src="/photos/pulses.jpg"
              alt="Walking the pulse field"
              className="h-48 w-full"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
          <h2 className="font-display text-3xl">Send a note</h2>
          <p className="mt-2 text-sm text-muted">
            Opens your email to {site.email}
          </p>
          <div className="mt-6">
            <EnquireForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-line p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Farm</p>
            <p className="mt-2 font-display text-2xl leading-snug">{address}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {village} is in Tindivanam taluk, Villupuram district. Call or
              write before you come — we will share the last-mile pin when a
              visit is confirmed.
            </p>
            <a
              href={site.phoneHref}
              className="mt-4 inline-flex font-semibold text-leaf underline-draw"
            >
              {site.phoneDisplay}
            </a>
            <a
              href={mapsUrl}
              className="mt-2 block text-sm font-semibold text-leaf underline-draw"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-line">
            <iframe
              title={`Map of ${village}, Tamil Nadu`}
              src={mapSrc}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href={mapsUrl}
              className="block bg-cream px-4 py-2 text-xs text-muted hover:text-leaf"
              target="_blank"
              rel="noreferrer"
            >
              Open {village} on Google Maps
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
