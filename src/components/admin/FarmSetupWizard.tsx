"use client";

import { createDeviceAction, saveFarmSetupAction } from "@/app/admin/actions";
import { firstPairNodes } from "@/lib/iot/hardware";
import { practicePacks } from "@/lib/packs/catalog";
import type { FarmProfile } from "@/lib/packs/types";
import { biomes } from "@/lib/profiles/biomes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function FarmSetupWizard({ profile, canSave = true }: { profile: FarmProfile; canSave?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [gpsNote, setGpsNote] = useState<string | null>(null);

  if (!canSave) {
    return (
      <div className="rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]">
        <p className="font-display text-2xl">Ask an operator to name the farm.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">You can still log notes, open the map, and walk the land.</p>
        <Link href="/admin" className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep font-semibold text-cream">
          Back to the log
        </Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="space-y-4 rounded-[1.75rem] bg-white px-5 py-5 shadow-[var(--shadow)]"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        start(async () => {
          setMessage(null);
          const data = new FormData(form);
          const saved = await saveFarmSetupAction(data);
          if (!saved.ok) {
            setMessage(saved.error);
            return;
          }
          const nodeName = String(data.get("nodeName") ?? "").trim();
          if (nodeName) {
            data.set("name", nodeName);
            const result = await createDeviceAction(data);
            if (!result.ok) {
              setMessage(`${result.error} The farm name is saved. Use the log now.`);
              return;
            }
            setToken(result.token);
          }
          router.push("/admin");
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Name</p>
        <h2 className="mt-1 font-display text-3xl leading-tight">What do you call this land?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          A name and a village are enough. Packs, the pin, and a sensor can wait.
        </p>
      </div>

      <label className="block text-sm font-semibold">
        Farm name
        <input name="name" defaultValue={profile.name === "New farm" ? "" : profile.name} placeholder="ET Samanya Farms" className="tap mt-1 w-full rounded-2xl border border-line bg-paper px-3 font-normal" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm font-semibold">
          Short name
          <input name="shortName" defaultValue={profile.shortName === "Farm" ? "" : profile.shortName} placeholder="Samanya" className="tap mt-1 w-full rounded-2xl border border-line bg-paper px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Village
          <input name="village" defaultValue={profile.location.village} placeholder="Thenkulapakkam" className="tap mt-1 w-full rounded-2xl border border-line bg-paper px-3 font-normal" />
        </label>
      </div>

      <details className="rounded-2xl bg-cream px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold">Packs, pin, and a sensor</summary>
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold">What you keep on this land</legend>
            <div className="mt-2 space-y-2">
              {practicePacks.map((pack) => (
                <label key={pack.id} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="packs"
                    value={pack.id}
                    defaultChecked={profile.enabledPacks.includes(pack.id)}
                    className="mt-1 h-5 w-5"
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
            Starting catalog
            <select name="biomeId" defaultValue={profile.biomeId} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal">
              {biomes.map((biome) => (
                <option key={biome.id} value={biome.id}>
                  {biome.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="applyBiome" value="1" defaultChecked={!profile.onboardedAt} className="h-5 w-5" />
            Load crops, trees, and beds from that catalog
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="publicSite" value="1" defaultChecked={profile.publicSite} className="h-5 w-5" />
            Keep the public website
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Timezone
              <input name="timezone" defaultValue={profile.timezone} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Currency
              <input name="currency" defaultValue={profile.currency} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Units
            <select name="units" defaultValue={profile.units} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal">
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Languages
            <input name="languages" defaultValue={profile.languages.join(", ")} placeholder="en, ta" className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
          </label>

          <p className="text-sm text-ink-soft">The map pin. Acres come later, from walking the fence.</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Latitude
              <input name="lat" defaultValue={profile.location.lat} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Longitude
              <input name="lng" defaultValue={profile.location.lng} className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
            </label>
          </div>
          <button
            type="button"
            className="tap w-full rounded-full border border-line bg-white text-sm font-semibold"
            onClick={() => {
              if (!navigator.geolocation || !formRef.current) {
                setGpsNote("This phone did not share a location. The saved pin stays.");
                return;
              }
              setGpsNote("Finding this phone…");
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lat = formRef.current?.elements.namedItem("lat") as HTMLInputElement | null;
                  const lng = formRef.current?.elements.namedItem("lng") as HTMLInputElement | null;
                  if (lat) lat.value = pos.coords.latitude.toFixed(6);
                  if (lng) lng.value = pos.coords.longitude.toFixed(6);
                  setGpsNote("Pin updated from this phone.");
                },
                () => setGpsNote("Location is off. The saved pin stays."),
                { enableHighAccuracy: true, timeout: 8000 },
              );
            }}
          >
            Use this phone’s location
          </button>
          {gpsNote ? <p className="text-sm text-ink-soft">{gpsNote}</p> : null}

          <label className="block text-sm font-semibold">
            Acres, if you already know them
            <input name="acres" defaultValue={profile.acres ?? ""} placeholder="Leave blank until the fence walk" className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
          </label>

          <p className="text-sm text-ink-soft">A sensor is optional. Phones are enough today. Leave the name empty to skip.</p>
          <label className="block text-sm font-semibold">
            Sensor name
            <input name="nodeName" placeholder="Pond" className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">
            Kind
            <select name="kind" defaultValue="pond" className="tap mt-1 w-full rounded-2xl border border-line bg-white px-3 font-normal">
              {firstPairNodes.map((item) => (
                <option key={item.id} value={item.kind}>
                  {item.kind} — {item.role}
                </option>
              ))}
            </select>
          </label>
          <select name="protocol" defaultValue="http" className="tap w-full rounded-2xl border border-line bg-white px-3">
            <option value="http">HTTP first (simplest)</option>
            <option value="mqtt">MQTT</option>
            <option value="lora">LoRa</option>
          </select>
          {token ? (
            <p className="break-all rounded-2xl bg-white px-3 py-3 text-sm">
              Copy this token now. It will not be shown again.
              <br />
              <code>{token}</code>
            </p>
          ) : null}
        </div>
      </details>

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

      <button type="submit" disabled={pending} className="tap w-full rounded-full bg-leaf-deep text-base font-semibold text-cream disabled:opacity-60">
        {pending ? "Saving…" : "Save and open the log"}
      </button>
    </form>
  );
}
