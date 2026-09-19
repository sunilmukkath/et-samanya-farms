"use client";

import { createObservationAction, suggestTreeVisionAction, suggestVoiceLogAction } from "@/app/admin/actions";
import { GpsBadge, useGps } from "@/components/admin/GpsBadge";
import { VoiceNote } from "@/components/admin/VoiceNote";
import type { AiSuggestion, AnimalRow, ObservationDomain, PlantStandRow, PlotRow } from "@/db/schema";
import { resolveFieldOptions } from "@/lib/capture";
import type { CaptureField, DomainDef, RuntimeFarm } from "@/lib/packs/types";
import { enqueueObservation } from "@/lib/offline-queue";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass =
  "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export type CaptureRuntime = Pick<
  RuntimeFarm,
  | "harvestCrops"
  | "harvestDestinations"
  | "kitItems"
  | "kitStatuses"
  | "activityTypes"
  | "pondLevels"
  | "defaultAnimalKind"
> & { domains: DomainDef[] };

export function CaptureSheet({
  domain,
  treeId,
  rainHintMm,
  plots = [],
  animals = [],
  plantStands = [],
  visionEnabled = false,
  source,
  redirectTo,
  runtime,
  plantStandId,
  phiWarning,
}: {
  domain: ObservationDomain;
  treeId?: string;
  rainHintMm?: number | null;
  plots?: Pick<PlotRow, "id" | "name" | "kind">[];
  animals?: Pick<AnimalRow, "id" | "name" | "species">[];
  plantStands?: Pick<PlantStandRow, "id" | "name" | "crop">[];
  visionEnabled?: boolean;
  source?: string;
  redirectTo?: string;
  runtime: CaptureRuntime;
  plantStandId?: string;
  phiWarning?: string | null;
}) {
  const router = useRouter();
  const { fix, error } = useGps();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [voiceLang, setVoiceLang] = useState("");
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [voiceFill, setVoiceFill] = useState<Record<string, string>>({});
  const meta = runtime.domains.find((item) => item.slug === domain) ?? runtime.domains[0];
  const wantsPhoto = Boolean(meta?.photoDefault);
  const fields = meta?.fields ?? [];

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

  if (!meta) return null;

  return (
    <form
      className="space-y-5 pb-2"
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
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{meta.label}</h1>
          <p className="mt-1 text-sm text-ink-soft">{meta.hint} Talk, confirm the chips, then save.</p>
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

      {phiWarning ? (
        <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">{phiWarning}</p>
      ) : null}

      {plots.length ? (
        <Select
          name="plotId"
          label="Plot"
          options={["", ...plots.map((plot) => plot.name)]}
          values={["", ...plots.map((plot) => plot.id)]}
        />
      ) : null}

      <div className={fields.some((field) => field.type === "date") ? "grid grid-cols-2 gap-3" : "space-y-4"}>
        {fields.map((field) => (
          <CaptureInput
            key={`${field.name}:${voiceFill[field.name] ?? ""}`}
            field={field}
            runtime={runtime}
            rainHintMm={rainHintMm}
            animals={animals}
            plantStands={plantStands}
            initialValue={voiceFill[field.name] ?? (field.name === "plantStandId" ? plantStandId : undefined)}
          />
        ))}
      </div>

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
          if (!visionEnabled) return;
          const fd = new FormData();
          fd.set("transcript", text);
          fd.set("domain", domain);
          start(async () => {
            const result = await suggestVoiceLogAction(fd);
            if (!result.ok) return;
            if (result.fill.note) setNote(result.fill.note);
            if (Object.keys(result.fill.fields).length) setVoiceFill(result.fill.fields);
          });
        }}
      />
      {Object.keys(voiceFill).length ? (
        <p className="text-sm text-ink-soft">Heard the chips below — change anything that is wrong, then save.</p>
      ) : null}

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-paper px-4 py-3">
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

function CaptureInput({
  field,
  runtime,
  rainHintMm,
  animals,
  plantStands,
  initialValue,
}: {
  field: CaptureField;
  runtime: CaptureRuntime;
  rainHintMm?: number | null;
  animals: Pick<AnimalRow, "id" | "name" | "species">[];
  plantStands: Pick<PlantStandRow, "id" | "name" | "crop">[];
  initialValue?: string;
}) {
  const resolved = resolveFieldOptions(field, runtime as RuntimeFarm, { animals, plantStands });
  const span = field.colSpan === 2 ? "col-span-2" : "";

  if (field.type === "chips") {
    return (
      <div className={span}>
        <ChipField
          name={field.name}
          label={field.label}
          options={resolved.options}
          values={resolved.values}
          initial={initialValue}
        />
      </div>
    );
  }
  if (field.type === "select") {
    if (!resolved.options.length) return null;
    return (
      <div className={span}>
        <Select
          name={field.name}
          label={field.label}
          options={resolved.options}
          values={resolved.values}
          initial={initialValue}
        />
      </div>
    );
  }
  const defaultValue =
    initialValue ??
    (field.hintFrom === "rainMm"
      ? undefined
      : field.defaultValue ?? (field.name === "animalKind" ? runtime.defaultAnimalKind : undefined));
  return (
    <label className={`block ${span}`}>
      <span className={labelClass}>{field.label}</span>
      <input
        name={field.name}
        type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
        step={field.step}
        inputMode={field.inputMode}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        className={fieldClass}
      />
      {field.hintFrom === "rainMm" && rainHintMm != null ? (
        <span className="mt-1 block text-xs text-muted">
          Sky model today {rainHintMm.toFixed(1)} mm — log the gauge if you walked it.
        </span>
      ) : null}
    </label>
  );
}

function ChipField({
  name,
  label,
  options,
  values,
  initial,
}: {
  name: string;
  label: string;
  options: string[];
  values?: string[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial || values?.[0] || options[0] || "");
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
  initial,
}: {
  name: string;
  label: string;
  options: string[];
  values?: string[];
  initial?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select name={name} defaultValue={initial} className={fieldClass}>
        {options.map((option, i) => (
          <option key={`${option}-${i}`} value={values?.[i] ?? option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DomainPicker({
  current,
  domains,
}: {
  current?: ObservationDomain;
  domains: DomainDef[];
}) {
  return (
    <div className="admin-fade-x sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-paper/95 px-4 py-2 backdrop-blur">
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
