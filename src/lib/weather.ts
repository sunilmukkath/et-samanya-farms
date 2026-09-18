import { unstable_cache } from "next/cache";
import type { WeatherSnapshot } from "@/db/schema";
import { farmCoords } from "@/lib/farm";

export type FarmWeather = WeatherSnapshot & {
  week: { date: string; rainMm: number; maxC: number | null; minC: number | null }[];
};

async function fetchFarmWeather(): Promise<FarmWeather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(farmCoords.lat));
  url.searchParams.set("longitude", String(farmCoords.lng));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
  );
  url.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "Asia/Kolkata");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      precipitation?: number;
      wind_speed_10m?: number;
      weather_code?: number;
    };
    daily?: {
      time?: string[];
      precipitation_sum?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
  };

  const week =
    data.daily?.time?.map((date, i) => ({
      date,
      rainMm: data.daily?.precipitation_sum?.[i] ?? 0,
      maxC: data.daily?.temperature_2m_max?.[i] ?? null,
      minC: data.daily?.temperature_2m_min?.[i] ?? null,
    })) ?? [];

  const weekRainMm = week.reduce((sum, day) => sum + (day.rainMm || 0), 0);

  return {
    tempC: data.current?.temperature_2m ?? null,
    humidity: data.current?.relative_humidity_2m ?? null,
    rainMm: data.current?.precipitation ?? null,
    windKmh: data.current?.wind_speed_10m ?? null,
    code: data.current?.weather_code ?? null,
    weekRainMm,
    fetchedAt: new Date().toISOString(),
    week,
  };
}

export const getFarmWeather = unstable_cache(fetchFarmWeather, ["farm-weather"], {
  revalidate: 600,
});

export function weatherSnapshot(weather: FarmWeather | null): WeatherSnapshot | null {
  if (!weather) return null;
  const { week: _week, ...snapshot } = weather;
  return snapshot;
}

export function weatherLabel(code: number | null | undefined) {
  if (code == null) return "Sky unknown";
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Showers";
  if (code <= 82) return "Heavy rain";
  if (code <= 99) return "Thunder";
  return "Sky unknown";
}
