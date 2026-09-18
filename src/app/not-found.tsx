import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">404</p>
          <h1 className="mt-3 font-display text-5xl tracking-tight">This path is fallow.</h1>
          <p className="mt-4 text-ink-soft">
            The page is not on the farm. Head back to the fields.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-leaf-deep px-6 font-semibold text-cream"
          >
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
