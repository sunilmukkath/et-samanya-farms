import { saveFarmSetupAction } from "@/app/admin/actions";
import { practicePacks } from "@/lib/packs/catalog";
import { biomes } from "@/lib/profiles/biomes";
import { getFarmProfile } from "@/lib/profile";

export default async function SetupPage() {
  const profile = await getFarmProfile();

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Farm setup</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Name this land, drop a map pin, pick practice packs and a biome catalog. You do not need to edit TypeScript.
      </p>
      <form action={saveFarmSetupAction} className="mt-5 space-y-4 rounded-3xl border border-line bg-white p-4">
        <label className="block text-sm font-semibold">
          Farm name
          <input name="name" defaultValue={profile.name} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Short name
          <input name="shortName" defaultValue={profile.shortName} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Village
          <input name="village" defaultValue={profile.location.village} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            Lat
            <input name="lat" defaultValue={profile.location.lat} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Lng
            <input name="lng" defaultValue={profile.location.lng} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            Timezone
            <input name="timezone" defaultValue={profile.timezone} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Currency
            <input name="currency" defaultValue={profile.currency} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Languages (comma)
          <input name="languages" defaultValue={profile.languages.join(", ")} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Acres
          <input name="acres" defaultValue={profile.acres ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Tree census target (blank to hide)
          <input name="treeCensusTarget" defaultValue={profile.treeCensusTarget ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Practice packs</legend>
          <div className="mt-2 space-y-2">
            {practicePacks.map((pack) => (
              <label key={pack.id} className="tap flex items-start gap-3 text-sm">
                <input type="checkbox" name="packs" value={pack.id} defaultChecked={profile.enabledPacks.includes(pack.id)} className="mt-2 h-4 w-4" />
                <span>
                  <span className="font-semibold">{pack.label}</span>
                  <span className="block text-ink-soft">{pack.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          Biome catalog
          <select name="biomeId" defaultValue={profile.biomeId} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal">
            {biomes.map((biome) => (
              <option key={biome.id} value={biome.id}>
                {biome.label}
              </option>
            ))}
          </select>
        </label>
        <label className="tap flex items-center gap-3 text-sm">
          <input type="checkbox" name="applyBiome" value="1" className="h-4 w-4" />
          Replace crops, species, plots, and rules from this biome
        </label>
        <label className="tap flex items-center gap-3 text-sm">
          <input type="checkbox" name="publicSite" value="1" defaultChecked={profile.publicSite} className="h-4 w-4" />
          Keep the public marketing site
        </label>
        <button type="submit" className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream">
          Save farm profile
        </button>
      </form>
    </div>
  );
}
