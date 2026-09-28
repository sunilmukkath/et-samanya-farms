"use client";

import { saveSectionCountAction, suggestSectionCountAction } from "@/app/admin/actions";
import type { SectionCountGuess } from "@/lib/section-count";
import { useState, useTransition } from "react";

export function SectionCountSheet({
  plots,
  gps,
  onClose,
  onSaved,
}: {
  plots: { id: string; name: string }[];
  gps: { lat: number; lng: number; accuracy: number | null } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [guess, setGuess] = useState<SectionCountGuess | null>(null);
  const [trees, setTrees] = useState("");
  const [plants, setPlants] = useState("0");
  const [plotId, setPlotId] = useState(plots[0]?.id ?? "");
  const [section, setSection] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[88%] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Count this section</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Photograph one belt of saplings and trees. Count only this frame, then confirm. Plants stay at 0 until a bed is in. Save each belt. When the planted trees are counted, go Home and mark the count done.
          </p>
        </div>
        <button type="button" className="tap shrink-0 px-2 text-sm text-muted" onClick={onClose}>
          Close
        </button>
      </div>

      <label className="admin-camera mt-4">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setFile(next ?? null);
            setPreview(next ? URL.createObjectURL(next) : null);
            setGuess(null);
            setMessage(null);
            if (!next) return;
            const fd = new FormData();
            fd.set("photo", next);
            start(async () => {
              const result = await suggestSectionCountAction(fd);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setGuess(result.guess);
              setTrees(String(result.guess.trees));
              setPlants(String(result.guess.plants));
            });
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span className="px-4 text-center text-base font-semibold text-ink-soft">
            Tap to photograph this section
          </span>
        )}
      </label>

      {pending ? <p className="mt-3 text-sm text-ink-soft">Counting stems in this frame…</p> : null}
      {message ? <p className="mt-3 text-sm font-semibold text-clay">{message}</p> : null}

      {guess ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!file) return;
            const fd = new FormData();
            fd.set("photo", file);
            fd.set("trees", trees);
            fd.set("plants", plants);
            fd.set("plotId", plotId);
            fd.set("section", section || plots.find((plot) => plot.id === plotId)?.name || "");
            fd.set("species", guess.species ?? "");
            fd.set("note", guess.note);
            if (gps) {
              fd.set("lat", String(gps.lat));
              fd.set("lng", String(gps.lng));
              if (gps.accuracy != null) fd.set("accuracyM", String(gps.accuracy));
            }
            start(async () => {
              const result = await saveSectionCountAction(fd);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              onSaved();
            });
          }}
        >
          <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm leading-relaxed">
            {guess.species ? <strong>{guess.species}. </strong> : null}
            {guess.note || "Edit the counts if the photo only caught part of the row."}
            {guess.confidence < 0.45 ? (
              <span className="mt-1 block text-ink-soft">Low confidence. Step back and include more stems in daylight.</span>
            ) : null}
            <span className="mt-1 block text-ink-soft">Nothing is saved until you confirm.</span>
          </p>
          {plots.length ? (
            <label className="block text-sm font-semibold">
              Named plot
              <select
                value={plotId}
                onChange={(event) => setPlotId(event.target.value)}
                className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal"
              >
                <option value="">New section name</option>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!plotId ? (
            <label className="block text-sm font-semibold">
              Section name
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="North belt, horticulture beds…"
                className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal"
                required
              />
            </label>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Trees in this frame
              <input
                inputMode="numeric"
                value={trees}
                onChange={(event) => setTrees(event.target.value)}
                className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal"
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Plants in this frame
              <input
                inputMode="numeric"
                value={plants}
                onChange={(event) => setPlants(event.target.value)}
                className="tap mt-1 w-full rounded-2xl border border-line px-3 font-normal"
                required
              />
            </label>
          </div>
          <button type="submit" disabled={pending} className="tap w-full rounded-full bg-leaf-deep font-semibold text-cream disabled:opacity-60">
            {pending ? "Saving…" : "Save this section"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
