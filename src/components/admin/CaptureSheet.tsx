"use client";

import { createObservationAction } from "@/app/admin/actions";
import { GpsBadge, useGps } from "@/components/admin/GpsBadge";
import type { ObservationDomain } from "@/db/schema";
import {
  activityTypes,
  domainBySlug,
  domains,
  harvestCrops,
  healthOptions,
  zoneLabels,
} from "@/lib/farm";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass =
  "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

export function CaptureSheet({
  domain,
  treeId,
  rainHintMm,
}: {
  domain: ObservationDomain;
  treeId?: string;
  rainHintMm?: number | null;
}) {
  const router = useRouter();
  const { fix, error } = useGps();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
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
      className="space-y-4 pb-8"
      action={(formData) => {
        setMessage(null);
        start(async () => {
          const result = await createObservationAction(formData);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          router.push(treeId ? "/admin/map" : `/admin/logs/${domain}`);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="domain" value={domain} />
      {treeId ? <input type="hidden" name="treeId" value={treeId} /> : null}
      {hiddenGps}

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-tamil text-sm text-muted">{meta.tamil}</p>
          <h1 className="font-display text-3xl">{meta.label}</h1>
        </div>
        <GpsBadge fix={fix} error={error} />
      </div>
      <p className="text-sm text-ink-soft">{meta.hint}</p>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {wantsPhoto ? "Photo" : "Photo (optional)"}
        </span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          required={wantsPhoto}
          className={fieldClass}
          onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? null)}
        />
        {photoName ? <p className="mt-1 text-xs text-muted">{photoName}</p> : null}
      </label>

      <DomainFields domain={domain} rainHintMm={rainHintMm} />

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Note
        </span>
        <textarea name="note" rows={3} placeholder="What did you see?" className={`${fieldClass} py-3`} />
      </label>

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="tap w-full rounded-full bg-leaf-deep text-base font-semibold text-cream disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save to the log"}
      </button>
    </form>
  );
}

function DomainFields({
  domain,
  rainHintMm,
}: {
  domain: ObservationDomain;
  rainHintMm?: number | null;
}) {
  if (domain === "harvest") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="crop" label="Crop" options={harvestCrops} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Qty</span>
          <input name="quantity" type="number" step="0.1" inputMode="decimal" className={fieldClass} />
        </label>
        <Select name="unit" label="Unit" options={["kg", "bundle", "crate", "count"]} />
      </div>
    );
  }

  if (domain === "rain") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Rain mm
          </span>
          <input
            name="rainMm"
            type="number"
            step="0.1"
            inputMode="decimal"
            defaultValue={rainHintMm ?? undefined}
            className={fieldClass}
          />
        </label>
        <Select name="pondLevel" label="Pond" options={["Low", "Ok", "High"]} />
      </div>
    );
  }

  if (domain === "soil") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="moisture" label="Moisture" options={["Dry", "Ok", "Wet"]} />
        <Select name="action" label="Action" options={["Noted", "Compost", "Mulch", "Test"]} />
      </div>
    );
  }

  if (domain === "plants") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="crop" label="Crop" options={harvestCrops} />
        <Select name="stage" label="Stage" options={["Seedling", "Growing", "Flowering", "Harvest"]} />
      </div>
    );
  }

  if (domain === "animals") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Kind</span>
          <input name="animalKind" defaultValue="Cattle" className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Count</span>
          <input name="animalCount" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <Select name="animalCondition" label="Condition" options={["Healthy", "Watch", "Stressed"]} />
      </div>
    );
  }

  if (domain === "plant_health") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="crop" label="Crop / tree" options={[...harvestCrops, "Tree"]} />
        <Select name="severity" label="Health" options={healthOptions.map((o) => o.label)} values={healthOptions.map((o) => o.value)} />
      </div>
    );
  }

  if (domain === "stay") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Guests</span>
          <input name="guestCount" type="number" inputMode="numeric" className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">From</span>
          <input name="stayFrom" type="date" className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">To</span>
          <input name="stayTo" type="date" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "activity") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="activityType" label="Type" options={activityTypes} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">People</span>
          <input name="attendees" type="number" inputMode="numeric" className={fieldClass} />
        </label>
      </div>
    );
  }

  if (domain === "trees") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Select name="action" label="Action" options={["Noted", "Watered", "Pruned", "Planted"]} />
        <Select name="zone" label="Zone" options={zoneLabels} />
      </div>
    );
  }

  return null;
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <select name={name} className={fieldClass}>
        {options.map((option, i) => (
          <option key={option} value={values?.[i] ?? option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DomainPicker({ current }: { current?: ObservationDomain }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
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
