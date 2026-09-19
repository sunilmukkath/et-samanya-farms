"use client";

import { askFarmAction } from "@/app/admin/actions";
import { VoiceNote } from "@/components/admin/VoiceNote";
import type { AskResult } from "@/lib/ask";
import { timeAgo } from "@/lib/farm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AskFarm({
  initialQuery,
  initial,
  visionEnabled,
}: {
  initialQuery: string;
  initial: AskResult | null;
  visionEnabled: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<AskResult | null>(initial);
  const [pending, start] = useTransition();

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    start(async () => {
      const next = await askFarmAction(q);
      setResult(next);
      router.replace(`/admin/search?q=${encodeURIComponent(q)}`, { scroll: false });
    });
  }

  return (
    <div>
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(query);
        }}
      >
        <input
          name="q"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="when did we last mulch the gourd beds?"
          className="tap w-full rounded-full border border-line bg-white px-5 text-base"
        />
        <div className="flex flex-wrap items-center gap-2">
          <VoiceNote
            onTranscript={(text) => {
              setQuery(text);
              ask(text);
            }}
          />
          <button
            type="submit"
            disabled={pending || !query.trim()}
            className="tap rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {pending ? "Listening to the log…" : "Ask"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-sm text-ink-soft">
        {visionEnabled
          ? "Talk or type. The answer is only from notes you saved."
          : "Talk or type to search. Add GEMINI_API_KEY for a spoken answer from the log."}
      </p>

      {result?.answer ? (
        <article className="mt-5 rounded-3xl border border-line bg-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">From the log</p>
          <p className="mt-2 text-base leading-relaxed">{result.answer}</p>
        </article>
      ) : null}

      <ul className="mt-6 space-y-3">
        {!result?.question && !pending ? (
          <li className="text-sm text-ink-soft">Type a crop, a Tamil name, or hold the mic and ask.</li>
        ) : result && result.rows.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            Nothing matches yet. The knowledge bank is the notes you save.
          </li>
        ) : (
          result?.rows.map((row) => (
            <li key={row.id} className="rounded-3xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {row.domainLabel} · {timeAgo(row.occurredAt)}
              </p>
              <p className="mt-2">{row.note || "Logged"}</p>
              <Link href={`/admin/logs/${row.domain}`} className="mt-2 inline-block text-sm text-clay">
                Open {row.domainLabel}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
