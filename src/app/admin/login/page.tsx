import { signIn } from "@/auth";
import { adminEmails, getAdminSession } from "@/lib/admin";
import { isGoogleAuthConfigured } from "@/lib/farm";
import { site } from "@/lib/site";
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
    <div className="flex min-h-dvh flex-col bg-leaf-deep px-5 py-12 text-cream">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">ET Samanya Farms</p>
        <h1 className="mt-3 font-display text-4xl">Farm log</h1>
        <p className="mt-3 text-sm leading-relaxed text-sand">
          Private field notebook for {site.location.village}. Sign in with a farm operator
          email.
        </p>

        {error ? (
          <p className="mt-4 rounded-2xl bg-clay-deep/80 px-4 py-3 text-sm">
            That sign-in is not on the farm list. Use a farm operator email.
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
                className="tap w-full rounded-full bg-leaf text-base font-semibold text-leaf-deep"
              >
                Continue with Google
              </button>
            </form>
          ) : null}

          {passwordOn ? (
            <form
              className="space-y-3 rounded-3xl bg-white/5 p-4"
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
                  className="tap mt-1 w-full rounded-2xl border-0 bg-white px-3 text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-sand">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  className="tap mt-1 w-full rounded-2xl border-0 bg-white px-3 text-ink"
                />
              </label>
              <button type="submit" className="tap w-full rounded-full bg-cream font-semibold text-leaf-deep">
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

        <Link href="/" className="mt-10 inline-block text-sm text-sand underline underline-offset-4">
          Back to the public site
        </Link>
      </div>
    </div>
  );
}
