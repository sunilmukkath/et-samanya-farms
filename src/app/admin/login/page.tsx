import { signIn } from "@/auth";
import { BrandLockup } from "@/components/Marks";
import { adminEmails, getAdminSession } from "@/lib/admin";
import { isGoogleAuthConfigured } from "@/lib/farm";
import { site } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return <LoginForm searchParams={searchParams} />;
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const google = isGoogleAuthConfigured();
  const allowed = adminEmails();
  const passwordOn = Boolean(process.env.AUTH_DEV_PASSWORD && allowed.length);

  return (
    <div className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-leaf-deep text-cream">
      <Image
        src="/photos/pond.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-leaf-deep via-leaf-deep/75 to-leaf-deep/35" />

      <div className="relative z-10 mx-auto w-full max-w-sm px-5 pb-[max(3rem,calc(1.25rem+env(safe-area-inset-bottom)))] pt-[max(3rem,env(safe-area-inset-top))]">
        <BrandLockup variant="white" className="h-12 sm:h-14" />
        <p className="font-tamil mt-3 text-sand">சாமான்ய உணவு</p>
        <h1 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl">Farm log</h1>
        <p className="mt-3 text-base leading-relaxed text-sand">
          Field notebook for {site.location.village}. Phone first, under the trees.
        </p>

        {error ? (
          <p className="mt-4 rounded-2xl bg-clay-deep/90 px-4 py-3 text-sm">
            That sign-in is not on the farm list. Use an allowlisted email.
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {google ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/admin" });
              }}
            >
              <button
                type="submit"
                className="tap w-full rounded-full bg-cream text-base font-semibold text-leaf-deep"
              >
                Continue with Google
              </button>
            </form>
          ) : null}

          {passwordOn ? (
            <form
              className="space-y-3 rounded-[1.75rem] bg-leaf-deep/50 p-4 ring-1 ring-white/15"
              action={async (formData) => {
                "use server";
                await signIn("farm-password", {
                  email: String(formData.get("email") ?? ""),
                  password: String(formData.get("password") ?? ""),
                  redirectTo: "/admin",
                });
              }}
            >
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-sand">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={allowed[0]}
                  className="tap mt-1 w-full rounded-2xl border-0 bg-white px-3 text-base text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-sand">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  className="tap mt-1 w-full rounded-2xl border-0 bg-white px-3 text-base text-ink"
                />
              </label>
              <button type="submit" className="tap w-full rounded-full bg-leaf font-semibold text-leaf-deep">
                Open the log
              </button>
            </form>
          ) : null}

          {!google && !passwordOn ? (
            <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm leading-relaxed">
              Set <code className="text-sun">AUTH_SECRET</code> and either Google OAuth or{" "}
              <code className="text-sun">AUTH_DEV_PASSWORD</code> in env.
            </p>
          ) : null}
        </div>

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-sand underline decoration-sun underline-offset-4">
          Public site
        </Link>
      </div>
    </div>
  );
}
