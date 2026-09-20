import type { WeatherSnapshot } from "@/db/schema";
import { getFarmProfile } from "@/lib/profile";

export type WeatherDay = {
  date: string;
  rainMm: number;
  maxC: number | null;
  minC: number | null;
  code: number | null;
};

export type FarmWeather = WeatherSnapshot & {
  week: WeatherDay[];
  todayDate: string;
};

function calendarDate(timezone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

async function fetchFarmWeather(lat: number, lng: number, timezone: string): Promise<FarmWeather | null> {
  const tz = timezone || "Asia/Kolkata";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
  );
  url.searchParams.set(
    "daily",
    "weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min",
  );
  url.searchParams.set("timezone", tz);
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "5");

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
      weather_code?: number[];
      precipitation_sum?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
  };

  const todayDate = calendarDate(tz);
  const week: WeatherDay[] =
    data.daily?.time?.map((date, i) => ({
      date,
      rainMm: data.daily?.precipitation_sum?.[i] ?? 0,
      maxC: data.daily?.temperature_2m_max?.[i] ?? null,
      minC: data.daily?.temperature_2m_min?.[i] ?? null,
      code: data.daily?.weather_code?.[i] ?? null,
    })) ?? [];

  const forward = week.filter((day) => day.date >= todayDate);
  const weekRainMm = forward.reduce((sum, day) => sum + (day.rainMm || 0), 0);

  return {
    tempC: data.current?.temperature_2m ?? null,
    humidity: data.current?.relative_humidity_2m ?? null,
    rainMm: data.current?.precipitation ?? null,
    windKmh: data.current?.wind_speed_10m ?? null,
    code: data.current?.weather_code ?? null,
    weekRainMm,
    fetchedAt: new Date().toISOString(),
    week,
    todayDate,
  };
}

export async function getFarmWeather() {
  const profile = await getFarmProfile();
  return fetchFarmWeather(profile.location.lat, profile.location.lng, profile.timezone);
}

export function weatherSnapshot(weather: FarmWeather | null): WeatherSnapshot | null {
  if (!weather) return null;
  const { week, todayDate, ...snapshot } = weather;
  void week;
  void todayDate;
  return snapshot;
}

export function todayRainMm(weather: FarmWeather | null) {
  if (!weather) return null;
  const today = weather.week.find((day) => day.date === weather.todayDate);
  return today?.rainMm ?? weather.rainMm;
}

export function weatherDayLabel(date: string, todayDate: string) {
  const day = new Date(`${date}T12:00:00`);
  const today = new Date(`${todayDate}T12:00:00`);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === -1) return "Yesterday";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return day.toLocaleDateString("en-IN", { weekday: "short" });
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
