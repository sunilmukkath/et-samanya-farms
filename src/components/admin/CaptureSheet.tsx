"use client";

import { createObservationAction, suggestTreeVisionAction } from "@/app/admin/actions";
import { GpsBadge, useGps } from "@/components/admin/GpsBadge";
import { VoiceNote } from "@/components/admin/VoiceNote";
import type { AiSuggestion, AnimalRow, ObservationDomain, PlotRow } from "@/db/schema";
import {
  activityTypes,
  domainBySlug,
  domains,
  harvestCrops,
  harvestDestinations,
  healthOptions,
  kitItems,
  kitStatuses,
  pondLevels,
} from "@/lib/farm";
import { enqueueObservation } from "@/lib/offline-queue";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass =
  "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export function CaptureSheet({
  domain,
  treeId,
  rainHintMm,
  plots = [],
  animals = [],
  visionEnabled = false,
  source,
  redirectTo,
}: {
  domain: ObservationDomain;
  treeId?: string;
  rainHintMm?: number | null;
  plots?: Pick<PlotRow, "id" | "name" | "kind">[];
  animals?: Pick<AnimalRow, "id" | "name" | "species">[];
  visionEnabled?: boolean;
  source?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { fix, error } = useGps();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [voiceLang, setVoiceLang] = useState("");
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const meta = domainBySlug[domain];
  const wantsPhoto = Boolean(meta.photoDefault);

  const hiddenGps = useMemo(
    () => (
      <>
        <input type="hidden" name="lat" value={fix?.lat ?? ""} />
        <input type="hidden" name="lng" value={fix?.lng ?? ""} />
        <input type="hidden" name="accuracyM" value={fix?.accuracy ?? ""} />
      </>
    ),
    [fix],
  );

  return (
    <form
      className="space-y-5 pb-28"
      action={(formData) => {
        setMessage(null);
        start(async () => {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            await enqueueObservation(formData);
            setMessage("Saved on this phone. It will send when you have signal.");
            return;
          }
          const result = await createObservationAction(formData);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          router.push(redirectTo ?? (treeId ? "/admin/map" : `/admin/logs/${domain}`));
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="domain" value={domain} />
      {treeId ? <input type="hidden" name="treeId" value={treeId} /> : null}
      {source ? <input type="hidden" name="source" value={source} /> : null}
      {voiceLang ? <input type="hidden" name="voiceLang" value={voiceLang} /> : null}
      {ai ? <input type="hidden" name="aiSuggestion" value={JSON.stringify(ai)} /> : null}
      {hiddenGps}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-tamil text-base text-clay">{meta.tamil}</p>
          <h1 className="font-display text-4xl leading-tight">{meta.label}</h1>
          <p className="mt-1 text-sm text-ink-soft">{meta.hint}</p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1">
          <GpsBadge fix={fix} error={error} />
        </span>
      </div>

      <label className="admin-camera">
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          required={wantsPhoto}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : null);
            if (!file || !visionEnabled) return;
            const fd = new FormData();
            fd.set("photo", file);
            fd.set("domain", domain);
            start(async () => {
              const result = await suggestTreeVisionAction(fd);
              if (result.ok) setAi(result.suggestion);
            });
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span className="px-4 text-center text-base font-semibold text-ink-soft">
            {wantsPhoto ? "Tap to take a photo" : "Photo (optional)"}
          </span>
        )}
      </label>

      {ai ? (
        <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">
          AI suggests <strong>{ai.species}</strong>
          {ai.issue ? ` · ${ai.issue}` : ""}
          {ai.culturalControl ? `. Try: ${ai.culturalControl}` : ""}
          {ai.compostMaturity ? ` · heap ${ai.compostMaturity}` : ""}
          {ai.cattleCondition ? ` · ${ai.cattleCondition}` : ""}
          . Confirm below — nothing is saved until you tap save.
        </p>
      ) : null}

      {plots.length ? (
        <Select
          name="plotId"
          label="Plot"
          options={["", ...plots.map((plot) => plot.name)]}
          values={["", ...plots.map((plot) => plot.id)]}
        />
      ) : null}

      <DomainFields domain={domain} rainHintMm={rainHintMm} animals={animals} />

      <label className="block">
        <span className={labelClass}>Note</span>
        <textarea
          name="note"
          rows={3}
          placeholder="What did you see?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${fieldClass} py-3`}
        />
      </label>
      <VoiceNote
        onTranscript={(text, lang) => {
          setNote((prev) => [prev, text].filter(Boolean).join(" ").trim());
          setVoiceLang(lang);
        }}
      />

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

      <div className="sticky bottom-3 z-20 -mx-4 bg-gradient-to-t from-paper via-paper to-transparent px-4 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="tap w-full rounded-full bg-leaf-deep text-base font-semibold text-cream shadow-lg disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save to the log"}
        </button>
      </div>
    </form>
  );
}

function DomainFields({
  domain,
  rainHintMm,
  animals,
}: {
  domain: ObservationDomain;
  rainHintMm?: number | null;
  animals: Pick<AnimalRow, "id" | "name" | "species">[];
}) {
  if (domain === "harvest") {
    return (
      <div className="space-y-4">
        <Select name="crop" label="Crop" options={harvestCrops} />
        <label className="block">
          <span className={labelClass}>Qty</span>
          <input name="quantity" type="number" step="0.1" inputMode="decimal" className={fieldClass} />
        </label>
        <ChipField name="unit" label="Unit" options={["kg", "bundle", "crate", "count"]} />
        <ChipField name="destination" label="Went to" options={harvestDestinations} />
      </div>
    );
  }

  if (domain === "rain") {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className={labelClass}>Rain mm</span>
          <input
            name="rainMm"
            type="number"
            step="0.1"
            inputMode="decimal"
            defaultValue={rainHintMm ?? undefined}
            className={fieldClass}
          />
        </label>
        <ChipField name="pondLevel" label="Pond" options={pondLevels} />
        <label className="block">
          <span className={labelClass}>Irrigation min</span>
          <input name="irrigationMinutes" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <ChipField name="pumpOn" label="Solar pump" options={["—", "On", "Off"]} values={["", "On", "Off"]} />
        <ChipField name="tankLevel" label="Tank" options={["—", "Low", "Ok", "High"]} values={["", "Low", "Ok", "High"]} />
        <label className="block">
          <span className={labelClass}>Canal / swale</span>
          <input name="canalNote" placeholder="Flow, silt, gate" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "soil") {
    return (
      <div className="space-y-4">
        <ChipField name="moisture" label="Moisture" options={["Dry", "Ok", "Wet"]} />
        <ChipField name="action" label="Action" options={["Noted", "Compost", "Mulch", "Vermiculture", "Test"]} />
      </div>
    );
  }

  if (domain === "plants") {
    return (
      <div className="space-y-4">
        <Select name="crop" label="Crop" options={harvestCrops} />
        <ChipField name="stage" label="Stage" options={["Seedling", "Growing", "Flowering", "Harvest"]} />
      </div>
    );
  }

  if (domain === "animals") {
    return (
      <div className="space-y-4">
        {animals.length ? (
          <Select
            name="animalId"
            label="Herd"
            options={["Herd note", ...animals.map((animal) => `${animal.name} (${animal.species})`)]}
            values={["", ...animals.map((animal) => animal.id)]}
          />
        ) : null}
        <label className="block">
          <span className={labelClass}>Kind</span>
          <input name="animalKind" defaultValue="Cattle" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Count</span>
          <input name="animalCount" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <ChipField name="animalCondition" label="Condition" options={["Healthy", "Watch", "Stressed"]} />
        <label className="block">
          <span className={labelClass}>Feed kg</span>
          <input name="feedKg" type="number" step="0.1" inputMode="decimal" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "plant_health") {
    return (
      <div className="space-y-4">
        <Select name="crop" label="Crop / tree" options={[...harvestCrops, "Tree"]} />
        <ChipField
          name="severity"
          label="Health"
          options={healthOptions.map((o) => o.label)}
          values={healthOptions.map((o) => o.value)}
        />
      </div>
    );
  }

  if (domain === "stay") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className={labelClass}>Guests</span>
          <input name="guestCount" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>From</span>
          <input name="stayFrom" type="date" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>To</span>
          <input name="stayTo" type="date" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "activity") {
    return (
      <div className="space-y-4">
        <ChipField name="activityType" label="Type" options={activityTypes} />
        <label className="block">
          <span className={labelClass}>People</span>
          <input name="attendees" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Hours</span>
          <input name="hours" type="number" step="0.5" inputMode="decimal" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Who</span>
          <input name="who" placeholder="Operator or village help" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "trees") {
    return <ChipField name="action" label="Action" options={["Noted", "Watered", "Pruned", "Planted", "Replaced"]} />;
  }

  if (domain === "kit") {
    return (
      <div className="space-y-4">
        <ChipField name="kitItem" label="Kit" options={kitItems} />
        <ChipField name="kitStatus" label="Status" options={kitStatuses} />
        <label className="block">
          <span className={labelClass}>Runtime hr</span>
          <input name="hours" type="number" step="0.1" inputMode="decimal" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Drip min</span>
          <input name="irrigationMinutes" type="number" inputMode="numeric" className={fieldClass} />
        </label>
      </div>
    );
  }

  return null;
}

function ChipField({
  name,
  label,
  options,
  values,
}: {
  name: string;
  label: string;
  options: string[];
  values?: string[];
}) {
  const initial = values?.[0] ?? options[0] ?? "";
  const [value, setValue] = useState(initial);
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {options.map((option, i) => {
          const next = values?.[i] ?? option;
          return (
            <button
              key={`${name}-${next || "empty"}-${i}`}
              type="button"
              data-on={value === next ? "true" : "false"}
              className="admin-chip"
              onClick={() => setValue(next)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Select({
  name,
  label,
  options,
  values,
}: {
  name: string;
  label: string;
  options: string[];
  values?: string[];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select name={name} className={fieldClass}>
        {options.map((option, i) => (
          <option key={`${option}-${i}`} value={values?.[i] ?? option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DomainPicker({ current }: { current?: ObservationDomain }) {
  return (
    <div className="admin-fade-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {domains.map((item) => (
        <a
          key={item.slug}
          href={`/admin/log?domain=${item.slug}`}
          data-on={current === item.slug ? "true" : "false"}
          className="admin-chip shrink-0"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
