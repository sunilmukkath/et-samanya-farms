"use client";

import { useState } from "react";

export function ShareNote({
  title,
  text,
  photoUrl,
}: {
  title: string;
  text: string;
  photoUrl?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const caption = [title, text].filter(Boolean).join("\n");

  async function share() {
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        if (photoUrl) {
          try {
            const blob = await fetch(photoUrl).then((res) => res.blob());
            const file = new File([blob], "farm.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ title, text: caption, files: [file] });
              return;
            }
          } catch {
            /* share text instead */
          }
        }
        await navigator.share({ title, text: caption });
        return;
      }
    } catch {
      return;
    } finally {
      setBusy(false);
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    setBusy(false);
  }

  return (
    <button type="button" onClick={() => void share()} disabled={busy} className="text-sm font-semibold text-leaf-deep">
      {busy ? "Sharing…" : "Share"}
    </button>
  );
}
