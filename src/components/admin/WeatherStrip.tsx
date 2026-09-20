import { weatherDayLabel, weatherLabel, type WeatherDay } from "@/lib/weather";

export function WeatherStrip({ days, todayDate }: { days: WeatherDay[]; todayDate: string }) {
  if (!days.length) return null;

  return (
    <div className="admin-fade-x mt-5 -mx-1 flex gap-2 overflow-x-auto pb-1">
      {days.map((day) => {
        const on = day.date === todayDate;
        return (
          <div
            key={day.date}
            data-on={on ? "true" : "false"}
            className={`min-w-[4.75rem] shrink-0 rounded-2xl px-2 py-2.5 text-center ${
              on ? "bg-cream/20 text-cream" : "bg-white/10 text-sand"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sun">
              {weatherDayLabel(day.date, todayDate)}
            </p>
            <p className="mt-1 font-display text-xl leading-none text-cream">
              {day.maxC != null ? `${Math.round(day.maxC)}°` : "—"}
            </p>
            <p className="mt-0.5 text-xs">{day.minC != null ? `${Math.round(day.minC)}°` : "—"}</p>
            <p className="mt-1 text-xs text-cream">{day.rainMm ? `${day.rainMm.toFixed(1)} mm` : "Dry"}</p>
            <p className="mt-0.5 text-[11px] leading-tight">{weatherLabel(day.code)}</p>
          </div>
        );
      })}
    </div>
  );
}
