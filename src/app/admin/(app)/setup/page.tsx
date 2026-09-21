import { FarmSetupWizard } from "@/components/admin/FarmSetupWizard";
import { currentRole } from "@/lib/admin";
import { kernelChecks } from "@/lib/kernel";
import { getFarmProfile } from "@/lib/profile";

export default async function SetupPage() {
  const profile = await getFarmProfile();
  const checks = kernelChecks();
  const role = await currentRole();

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Farm setup</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Name this land, enable packs, drop a map pin, pair the first node. You do not edit TypeScript.
      </p>
      <ul className="mt-4 space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className={`rounded-[1.25rem] px-4 py-3 text-sm ${check.ok ? "bg-white text-ink-soft" : "bg-cream text-ink"}`}
          >
            <span className="font-semibold">{check.label}:</span> {check.hint}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <FarmSetupWizard profile={profile} canSave={role === "operator"} />
      </div>
    </div>
  );
}
