import type { WaterSnapshot } from "@/lib/water";
import Link from "next/link";

export function OnFarmWater({ water }: { water: WaterSnapshot }) {
  const bits = [
    water.gaugeMm != null
      ? `${water.gaugeMm} mm ${water.gaugeSource === "sensor" ? "gauge" : "logged"}${water.gaugeWhen ? ` · ${water.gaugeWhen}` : ""}`
      : null,
    water.pondLevel ? `Pond ${water.pondLevel}${water.pondWhen ? ` · ${water.pondWhen}` : ""}` : null,
    water.pump ? `${water.pump}${water.pumpWhen ? ` · ${water.pumpWhen}` : ""}` : null,
  ].filter(Boolean);

  return (
    <Link href="/admin/log?domain=rain" className="mt-4 block rounded-[1.75rem] bg-white px-5 py-4 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">On the land</p>
      {bits.length ? (
        <p className="mt-2 text-base">{bits.join(" · ")}</p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">
          Open-Meteo is a sky model. Log the gauge, Sensei pond, and pump hours when you walk them.
        </p>
      )}
    </Link>
  );
}
