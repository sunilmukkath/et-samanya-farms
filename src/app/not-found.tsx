import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">404</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight">This path is fallow.</h1>
      <p className="mt-4 text-ink-soft">
        The page is not on the farm. Head back to the fields.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-leaf px-6 font-semibold text-cream"
      >
        Home
      </Link>
    </div>
  );
}
