"use client";

import { createDeviceAction, saveFarmSetupAction } from "@/app/admin/actions";
import { firstPairNodes } from "@/lib/iot/hardware";
import { practicePacks } from "@/lib/packs/catalog";
import type { FarmProfile } from "@/lib/packs/types";
import { biomes } from "@/lib/profiles/biomes";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const steps = ["Name", "Packs", "Map", "First node"] as const;

export function FarmSetupWizard({ profile }: { profile: FarmProfile }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <ol className="mb-5 grid grid-cols-4 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {steps.map((label, i) => (
          <li key={label} className={i === step ? "text-leaf-deep" : ""}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form
        ref={formRef}
        className="space-y-4 rounded-3xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          start(async () => {
            setMessage(null);
            const data = new FormData(form);
            if (step < 3) {
              await saveFarmSetupAction(data);
              setStep((value) => value + 1);
              return;
            }
            const nodeName = String(data.get("nodeName") ?? "").trim();
            await saveFarmSetupAction(data);
            if (nodeName) {
              data.set("name", nodeName);
              const result = await createDeviceAction(data);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setToken(result.token);
            }
            router.push("/admin");
            router.refresh();
          });
        }}
      >
        <div className={step === 0 ? "space-y-4" : "hidden"}>
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
          <label className="block text-sm font-semibold">
            Acres
            <input name="acres" defaultValue={profile.acres ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
          <details className="rounded-2xl bg-cream px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Timezone, currency, languages</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                Units
                <select name="units" defaultValue={profile.units} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal">
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Languages (comma)
                <input name="languages" defaultValue={profile.languages.join(", ")} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
              </label>
              <label className="tap flex items-center gap-3 text-sm">
                <input type="checkbox" name="publicSite" value="1" defaultChecked={profile.publicSite} className="h-4 w-4" />
                Keep the public marketing site
              </label>
            </div>
          </details>
        </div>

        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <fieldset>
            <legend className="text-sm font-semibold">Practice packs</legend>
            <div className="mt-2 space-y-2">
              {practicePacks.map((pack) => (
                <label key={pack.id} className="tap flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="packs"
                    value={pack.id}
                    defaultChecked={profile.enabledPacks.includes(pack.id)}
                    className="mt-2 h-4 w-4"
                  />
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
            <input type="checkbox" name="applyBiome" value="1" defaultChecked={!profile.onboardedAt} className="h-4 w-4" />
            Load crops, species, plots, and rules from this biome
          </label>
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-ink-soft">Drop a pin. Walk the boundary later on the map.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Lat
              <input name="lat" defaultValue={profile.location.lat} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Lng
              <input name="lng" defaultValue={profile.location.lng} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
            </label>
          </div>
          <button
            type="button"
            className="tap w-full rounded-full border border-line text-sm font-semibold"
            onClick={() => {
              if (!navigator.geolocation || !formRef.current) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                const lat = formRef.current?.elements.namedItem("lat") as HTMLInputElement | null;
                const lng = formRef.current?.elements.namedItem("lng") as HTMLInputElement | null;
                if (lat) lat.value = String(pos.coords.latitude);
                if (lng) lng.value = String(pos.coords.longitude);
              });
            }}
          >
            Use this phone’s GPS
          </button>
          <label className="block text-sm font-semibold">
            Tree census target (blank to hide)
            <input name="treeCensusTarget" defaultValue={profile.treeCensusTarget ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Animal target
              <input name="animalCensusTarget" defaultValue={profile.animalCensusTarget ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Bed target
              <input name="bedCensusTarget" defaultValue={profile.bedCensusTarget ?? ""} className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
            </label>
          </div>
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-ink-soft">
            Pair the first observe node. Leave the name blank to skip — phones are enough today.
          </p>
          <label className="block text-sm font-semibold">
            Node name
            <input name="nodeName" placeholder="Sensei pond" className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Kind
            <select name="kind" defaultValue="pond" className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal">
              {firstPairNodes.map((item) => (
                <option key={item.id} value={item.kind}>
                  {item.kind} — {item.role}
                </option>
              ))}
            </select>
          </label>
          <select name="protocol" defaultValue="http" className="tap w-full rounded-2xl border border-line px-3">
            <option value="http">HTTP first (simplest)</option>
            <option value="mqtt">MQTT</option>
            <option value="lora">LoRa</option>
          </select>
          {token ? (
            <p className="break-all rounded-2xl bg-cream px-3 py-3 text-sm">
              Copy this token now. It will not be shown again.
              <br />
              <code>{token}</code>
            </p>
          ) : null}
        </div>

        {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

        <div className="flex gap-2">
          {step > 0 ? (
            <button type="button" className="tap flex-1 rounded-full border border-line font-semibold" onClick={() => setStep((value) => value - 1)}>
              Back
            </button>
          ) : null}
          <button type="submit" disabled={pending} className="tap flex-1 rounded-full bg-leaf-deep text-sm font-semibold text-cream disabled:opacity-60">
            {pending ? "Saving…" : step === 3 ? "Finish" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
