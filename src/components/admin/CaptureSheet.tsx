"use client";

import { createObservationAction, suggestTreeVisionAction, suggestVoiceLogAction } from "@/app/admin/actions";
import { FlowSteps } from "@/components/admin/FlowSteps";
import { GpsBadge, useGps } from "@/components/admin/GpsBadge";
import { VoiceNote } from "@/components/admin/VoiceNote";
import type { AiSuggestion, AnimalRow, ObservationDomain, PlantStandRow, PlotRow } from "@/db/schema";
import { resolveFieldOptions } from "@/lib/capture";
import type { CaptureField, DomainDef, RuntimeFarm } from "@/lib/packs/types";
import { enqueueObservation } from "@/lib/offline-queue";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass = "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

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

type StepId = "photo" | "plot" | "extra" | "note" | "review" | `field:${string}`;

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
  mode = "full",
  group,
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
  mode?: "note" | "full";
  group?: string;
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
  const [step, setStep] = useState(0);
  const meta = runtime.domains.find((item) => item.slug === domain) ?? runtime.domains[0];
  const wantsPhoto = Boolean(meta?.photoDefault);
  const fields = mode === "note" ? [] : (meta?.fields ?? []);
  const primaryFields = fields.filter((field) => !field.collapsed);
  const extraFields = fields.filter((field) => field.collapsed);
  const afterSave =
    redirectTo ??
    (treeId ? "/admin/map" : `/admin/log?domain=${domain}${group ? `&group=${group}` : ""}&view=past`);

  const steps = useMemo(() => {
    const list: { id: StepId; title: string; optional?: boolean }[] = [
      { id: "photo", title: "Photo", optional: !wantsPhoto },
    ];
    if (mode !== "note" && plots.length) list.push({ id: "plot", title: "Plot", optional: true });
    for (const field of primaryFields) list.push({ id: `field:${field.name}`, title: field.label });
    if (extraFields.length) list.push({ id: "extra", title: "More water", optional: true });
    list.push({ id: "note", title: "Note", optional: true });
    list.push({ id: "review", title: "Save" });
    return list;
  }, [extraFields.length, mode, plots.length, primaryFields, wantsPhoto]);

  const current = steps[step] ?? steps[0];
  const last = step >= steps.length - 1;

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

  function goNext() {
    if (current.id === "photo" && wantsPhoto && !preview) {
      setMessage("Take a photo first.");
      return;
    }
    setMessage(null);
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  return (
    <form
      className="space-y-5 pb-6"
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
          router.push(afterSave);
          router.refresh();
        });
      }}
      onSubmit={(event) => {
        if (!last) {
          event.preventDefault();
          goNext();
        }
      }}
    >
      <input type="hidden" name="domain" value={domain} />
      {treeId ? <input type="hidden" name="treeId" value={treeId} /> : null}
      {source ? <input type="hidden" name="source" value={source} /> : null}
      {voiceLang ? <input type="hidden" name="voiceLang" value={voiceLang} /> : null}
      {ai ? <input type="hidden" name="aiSuggestion" value={JSON.stringify(ai)} /> : null}
      {hiddenGps}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-tamil text-base text-clay">{mode === "note" ? "குறிப்பு" : meta.tamil}</p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{mode === "note" ? "Note" : meta.label}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "note" ? "Photo, voice, or a line of text — one step at a time." : `${meta.hint}. One question, then the next.`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1">
          <GpsBadge fix={fix} error={error} />
        </span>
      </div>

      <FlowSteps current={step + 1} total={steps.length} label={current.title} />

      {phiWarning ? (
        <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">{phiWarning}</p>
      ) : null}

      <section className={current.id === "photo" ? "space-y-3" : "hidden"}>
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
            . Confirm on the next screens — nothing is saved until you tap save.
          </p>
        ) : null}
      </section>

      {mode !== "note" && plots.length ? (
        <section className={current.id === "plot" ? "" : "hidden"}>
          <Select
            name="plotId"
            label="Plot"
            options={["", ...plots.map((plot) => plot.name)]}
            values={["", ...plots.map((plot) => plot.id)]}
          />
        </section>
      ) : null}

      {fields.map((field) => {
        const on = current.id === `field:${field.name}` || (current.id === "extra" && field.collapsed);
        return (
          <section key={`${field.name}:${voiceFill[field.name] ?? ""}`} className={on ? "" : "hidden"}>
            <CaptureInput
              field={field}
              runtime={runtime}
              rainHintMm={rainHintMm}
              animals={animals}
              plantStands={plantStands}
              initialValue={voiceFill[field.name] ?? (field.name === "plantStandId" ? plantStandId : undefined)}
            />
          </section>
        );
      })}

      {current.id === "extra" && extraFields.length ? (
        <p className="text-sm text-ink-soft">Pond, pump, tank, and canal — skip if you only walked the rain gauge.</p>
      ) : null}

      <section className={current.id === "note" || current.id === "review" ? "space-y-3" : "hidden"}>
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
      </section>

      {current.id === "review" ? (
        <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">
          Check the note{preview ? ", photo" : ""} and chips, then save to the log.
          {Object.keys(voiceFill).length ? " Voice filled some chips — change anything that is wrong." : ""}
        </p>
      ) : null}

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

      <div className="pt-2">
        <div className="flex gap-2">
          {step > 0 ? (
            <button
              type="button"
              className="tap flex-1 rounded-full border border-line font-semibold"
              onClick={() => {
                setMessage(null);
                setStep((value) => Math.max(0, value - 1));
              }}
            >
              Back
            </button>
          ) : null}
          {current.optional && !last ? (
            <button type="button" className="tap flex-1 rounded-full border border-line font-semibold" onClick={goNext}>
              Skip
            </button>
          ) : null}
          <button
            type={last ? "submit" : "button"}
            disabled={pending}
            onClick={last ? undefined : goNext}
            className="tap flex-[2] rounded-full bg-leaf-deep text-base font-semibold text-cream shadow-lg disabled:opacity-60"
          >
            {pending ? "Saving…" : last ? "Save to the log" : "Next"}
          </button>
        </div>
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

  if (field.type === "chips") {
    return (
      <ChipField
        name={field.name}
        label={field.label}
        options={resolved.options}
        values={resolved.values}
        initial={initialValue}
      />
    );
  }
  if (field.type === "select") {
    if (!resolved.options.length) return null;
    return (
      <Select
        name={field.name}
        label={field.label}
        options={resolved.options}
        values={resolved.values}
        initial={initialValue}
      />
    );
  }
  const defaultValue =
    initialValue ??
    (field.hintFrom === "rainMm"
      ? undefined
      : field.defaultValue ?? (field.name === "animalKind" ? runtime.defaultAnimalKind : undefined));
  return (
    <label className="block">
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
      <div className="grid grid-cols-2 gap-2 pb-2">
        {options.map((option, i) => {
          const next = values?.[i] ?? option;
          return (
            <button
              key={`${name}-${next || "empty"}-${i}`}
              type="button"
              data-on={value === next ? "true" : "false"}
              className="admin-chip justify-center text-center"
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
