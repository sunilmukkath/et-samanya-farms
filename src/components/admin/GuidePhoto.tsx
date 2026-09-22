"use client";

import { suggestTreeVisionAction } from "@/app/admin/actions";
import type { AiSuggestion } from "@/db/schema";
import Link from "next/link";
import { useState, useTransition } from "react";

const causeLabel: Record<string, string> = {
  pest: "Pest",
  disease: "Disease",
  nutrient: "Nutrient",
  water: "Water",
};

export function GuidePhoto() {
  const [preview, setPreview] = useState<string | null>(null);
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <label className="admin-camera">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : null);
            setAi(null);
            setError(null);
            if (!file) return;
            const fd = new FormData();
            fd.set("photo", file);
            fd.set("pack", "plant_health");
            start(async () => {
              const result = await suggestTreeVisionAction(fd);
              if (result.ok) setAi(result.suggestion);
              else setError(result.error);
            });
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span className="px-4 text-center text-base font-semibold text-ink-soft">
            Tap to photograph one sick leaf
          </span>
        )}
      </label>
      {pending ? <p className="mt-3 text-sm text-ink-soft">Reading the leaf…</p> : null}
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
      {ai ? (
        <div className="mt-3 rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">
          <p>
            <strong>{ai.species}</strong>
            {ai.tamil ? ` (${ai.tamil})` : ""}
            {ai.cause && causeLabel[ai.cause] ? ` · ${causeLabel[ai.cause]}` : ""}
            {ai.issue ? ` · ${ai.issue}` : ""}
          </p>
          {ai.culturalControl ? <p className="mt-1">Next: {ai.culturalControl}</p> : null}
          {ai.confidence < 0.45 ? (
            <p className="mt-1 text-ink-soft">Low confidence. Photograph one leaf in daylight, filling the frame.</p>
          ) : null}
          <p className="mt-2 text-ink-soft">Nothing is saved yet.</p>
          <Link href="/admin/log?domain=plant_health&group=crop" className="mt-2 inline-block font-semibold text-leaf-deep">
            Save it on the crop log
          </Link>
        </div>
      ) : null}
    </div>
  );
}
