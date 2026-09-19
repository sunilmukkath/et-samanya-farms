import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-3xl sm:text-4xl">That log is not here.</h1>
      <Link href="/admin" className="tap mt-6 inline-flex items-center rounded-full bg-leaf-deep px-5 font-semibold text-cream">
        Farm log home
      </Link>
    </div>
  );
}
