"use client";

import { createObservationAction } from "@/app/admin/actions";
import { flushQueuedObservations } from "@/lib/offline-queue";
import { useEffect, useState } from "react";

export function PwaRegister() {
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => undefined);
    }
    const flush = () =>
      flushQueuedObservations(createObservationAction).then((left) => setQueued(left));
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  if (!queued) return null;
  return (
    <p className="bg-sun/20 px-4 py-2 text-center text-xs font-semibold text-leaf-deep">
      {queued} note{queued === 1 ? "" : "s"} waiting for signal
    </p>
  );
}
