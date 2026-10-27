import { FarmSetupWizard } from "@/components/admin/FarmSetupWizard";
import { useSamanyaFarmAction } from "@/app/admin/actions";
import { currentRole } from "@/lib/admin";
import { kernelChecks } from "@/lib/kernel";
import { getFarmProfile } from "@/lib/profile";
import { farmLooksUnset } from "@/lib/profiles/samanya";
import Link from "next/link";

export default async function SetupPage() {
  const profile = await getFarmProfile();
  const missing = kernelChecks().filter((check) => !check.ok);
  const role = await currentRole();
  const unset = farmLooksUnset(profile);

  return (
    <div className="texture grain">
      <div className="mx-auto max-w-xl px-4 py-5 pb-10">
        <p className="font-tamil text-sm text-muted">சாமான்ய உணவு</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">You are in.</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          The log, the map, and the books are already open. This page only names the land. Leave it whenever you want.
        </p>

        <Link href="/admin" className="tap mt-5 flex items-center justify-center rounded-full border border-line bg-white font-semibold">
          Use the log now
        </Link>

        {role === "operator" && unset ? (
          <form action={useSamanyaFarmAction} className="mt-3">
            <button type="submit" className="tap w-full rounded-full bg-leaf font-semibold text-leaf-deep">
              This is ET Samanya, Thenkulapakkam
            </button>
          </form>
        ) : null}

        <div className="mt-6">
          <FarmSetupWizard profile={profile} canSave={role === "operator"} />
        </div>

        {missing.length ? (
          <p className="mt-5 text-sm leading-relaxed text-ink-soft">{missing.map((check) => check.hint).join(" ")}</p>
        ) : null}
      </div>
    </div>
  );
}
