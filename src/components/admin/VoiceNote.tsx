"use client";

import { useState } from "react";

export function VoiceNote({
  onTranscript,
}: {
  onTranscript: (text: string, lang: string) => void;
}) {
  const [listening, setListening] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && "webkitSpeechRecognition" in window;

  if (!supported) {
    return <p className="text-xs text-muted">Voice needs Chrome or Safari on this phone.</p>;
  }

  function listen(lang: string) {
    const Ctor = (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      if (text) onTranscript(text, lang);
    };
    rec.onend = () => setListening(null);
    rec.onerror = () => setListening(null);
    setListening(lang);
    rec.start();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="admin-chip"
        data-on={listening === "ta-IN" ? "true" : "false"}
        onClick={() => listen("ta-IN")}
      >
        {listening === "ta-IN" ? "Listening…" : "தமிழ் voice"}
      </button>
      <button
        type="button"
        className="admin-chip"
        data-on={listening === "en-IN" ? "true" : "false"}
        onClick={() => listen("en-IN")}
      >
        {listening === "en-IN" ? "Listening…" : "English voice"}
      </button>
    </div>
  );
}

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};
