import { FarmSetupWizard } from "@/components/admin/FarmSetupWizard";
import { getFarmProfile } from "@/lib/profile";

export default async function SetupPage() {
  const profile = await getFarmProfile();

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Farm setup</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Name this land, enable packs, drop a map pin, pair the first node. You do not edit TypeScript.
      </p>
      <div className="mt-5">
        <FarmSetupWizard profile={profile} />
      </div>
    </div>
  );
}
