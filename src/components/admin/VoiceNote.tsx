"use client";

import { useEffect, useState } from "react";

const voiceLangs = [
  { lang: "ta-IN", label: "தமிழ் voice" },
  { lang: "hi-IN", label: "हिन्दी voice" },
  { lang: "en-IN", label: "English voice" },
];

export function VoiceNote({
  onTranscript,
  langs = ["ta-IN", "en-IN"],
}: {
  onTranscript: (text: string, lang: string) => void;
  langs?: string[];
}) {
  const [listening, setListening] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported("webkitSpeechRecognition" in window);
  }, []);

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

  const buttons = voiceLangs.filter((item) => langs.includes(item.lang));

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((item) => (
        <button
          key={item.lang}
          type="button"
          className="admin-chip"
          data-on={listening === item.lang ? "true" : "false"}
          onClick={() => listen(item.lang)}
        >
          {listening === item.lang ? "Listening…" : item.label}
        </button>
      ))}
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
