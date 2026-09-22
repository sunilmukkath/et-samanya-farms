"use client";

import { askGuideAction } from "@/app/admin/actions";
import { VoiceNote } from "@/components/admin/VoiceNote";
import type { GuideScale } from "@/lib/guide";
import { useState, useTransition } from "react";

export function GuideAsk({ scale }: { scale: GuideScale }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, start] = useTransition();

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    start(async () => {
      const next = await askGuideAction(q, scale);
      setAnswer(next.answer);
    });
  }

  return (
    <div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(query);
        }}
      >
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={scale === "home" ? "why are the pot leaves yellow?" : "should I irrigate the gourd bed?"}
          className="tap w-full rounded-full border border-line bg-white px-5 text-base"
        />
        <div className="flex flex-wrap items-center gap-2">
          <VoiceNote langs={["ta-IN", "hi-IN", "en-IN"]} onTranscript={(text) => ask(text)} />
          <button
            type="submit"
            disabled={pending || !query.trim()}
            className="tap rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {pending ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>
      {answer ? (
        <article className="mt-4 rounded-3xl border border-line bg-white px-5 py-5">
          <p className="text-base leading-relaxed">{answer}</p>
        </article>
      ) : null}
    </div>
  );
}
