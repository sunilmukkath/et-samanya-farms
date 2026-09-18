import Link from "next/link";
import { BrandLockup } from "@/components/Marks";
import { getAdminSession } from "@/lib/admin";
import { site } from "@/lib/site";

export async function SiteFooter() {
  const session = await getAdminSession();

  return (
    <footer className="border-t border-line bg-leaf-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div>
            <BrandLockup variant="white" />
            <p className="font-tamil mt-2 text-sm text-sand">சாமான்ய உணவு</p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sand">
            Five acres of agroforestry. Everyday food among more than 1,600
            trees. {site.tagline}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">On this land</p>
          <ul className="mt-3 space-y-2 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-sun">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">Write to us</p>
          <p className="mt-3 text-sm leading-relaxed">
            {site.location.address}
          </p>
          <a href={site.phoneHref} className="mt-3 inline-block text-sm underline decoration-sun underline-offset-4">
            {site.phoneDisplay}
          </a>
          <a href={`mailto:${site.email}`} className="mt-2 block text-sm underline decoration-sun underline-offset-4">
            {site.email}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-sand sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {site.legalName}</p>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/admin" className="font-semibold text-cream underline decoration-sun underline-offset-4 hover:text-sun">
                Farm log
              </Link>
            ) : null}
            <p>CIN {site.cin}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
