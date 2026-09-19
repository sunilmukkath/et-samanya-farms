"use client";

import { useEffect, useState } from "react";

export type GpsFix = {
  lat: number;
  lng: number;
  accuracy: number;
};

export function useGps() {
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("This phone has no GPS.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => setError(err.message || "GPS denied"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 4000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { fix, error };
}

export function GpsBadge({ fix, error }: { fix: GpsFix | null; error: string | null }) {
  const accuracy = fix ? Math.round(fix.accuracy) : null;
  const tone = !fix ? "text-clay" : accuracy && accuracy > 15 ? "text-sun" : "text-leaf-deep";

  return (
    <p className={`max-w-[9.5rem] truncate text-[11px] font-semibold ${tone}`}>
      {error ? `GPS: ${error}` : fix ? `GPS ±${accuracy} m` : "Finding GPS…"}
    </p>
  );
}
