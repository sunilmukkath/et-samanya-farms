import { canPersistFarmData, listObservations } from "@/db/queries";
import type { ObservationRow } from "@/db/schema";
import { getFarmProfile } from "@/lib/profile";

export type TrendSpan = {
  label: string;
  rainMm: number;
  avgMaxC: number | null;
  avgMinC: number | null;
  rainDays: number;
  gaugeMm: number | null;
};

export type TrendCompare = {
  title: string;
  current: TrendSpan;
  previous: TrendSpan;
  rainDeltaMm: number;
  tempDeltaC: number | null;
};

export type TrendBucket = {
  key: string;
  label: string;
  rainMm: number;
  avgMaxC: number | null;
  gaugeMm: number | null;
};

export type WeatherTrends = {
  place: string;
  wow: TrendCompare;
  mom: TrendCompare;
  yoy: TrendCompare;
  weeks: TrendBucket[];
  months: TrendBucket[];
  years: TrendBucket[];
};

type Day = {
  date: string;
  rainMm: number | null;
  maxC: number | null;
  minC: number | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function loadWeatherTrends(): Promise<WeatherTrends | null> {
  const profile = await getFarmProfile();
  const tz = profile.timezone || "Asia/Kolkata";
  const today = calendarDate(tz);
  const start = `${Number(today.slice(0, 4)) - 2}-01-01`;
  const [archive, recent, gauge] = await Promise.all([
    fetchDaily(archiveUrl(profile.location.lat, profile.location.lng, start, addDays(today, -1), tz)),
    fetchDaily(recentUrl(profile.location.lat, profile.location.lng, tz)),
    loadGauge(tz, start),
  ]);
  const days = mergeDays(archive, recent);
  if (!days.size) return null;
  return assembleWeatherTrends({
    place: profile.location.village || profile.shortName,
    today,
    days,
    gauge,
  });
}

export function assembleWeatherTrends(input: {
  place: string;
  today: string;
  days: Map<string, Day>;
  gauge: Map<string, number>;
}): WeatherTrends {
  const today = input.today;
  const weekStart = mondayOnOrBefore(today);
  const daysIntoWeek = diffDays(weekStart, today);
  const prevWeekStart = addDays(weekStart, -7);
  const monthStart = `${today.slice(0, 7)}-01`;
  const prevMonthStart = shiftMonth(monthStart, -1);
  const dayOfMonth = Number(today.slice(8, 10));
  const prevMonthEnd = addDays(prevMonthStart, Math.min(dayOfMonth, daysInMonth(prevMonthStart)) - 1);
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const prevYearStart = `${Number(today.slice(0, 4)) - 1}-01-01`;
  const prevYearEnd = sameDayLastYear(today);

  const wow = compare(
    "This week vs last week",
    span("This week", input, weekStart, today),
    span("Last week", input, prevWeekStart, addDays(prevWeekStart, daysIntoWeek)),
  );
  const mom = compare(
    "This month vs last month",
    span("This month", input, monthStart, today),
    span("Last month", input, prevMonthStart, prevMonthEnd),
  );
  const yoy = compare(
    "This year vs last year",
    span("This year", input, yearStart, today),
    span("Last year", input, prevYearStart, prevYearEnd),
  );

  const weeks: TrendBucket[] = [];
  for (let i = 7; i >= 0; i -= 1) {
    const start = addDays(weekStart, -7 * i);
    const end = i === 0 ? today : addDays(start, 6);
    const summed = sumRange(input.days, input.gauge, start, end);
    weeks.push({
      key: start,
      label: i === 0 ? "This week" : `${dayLabel(start)}–${dayLabel(end)}`,
      rainMm: summed.rainMm,
      avgMaxC: summed.avgMaxC,
      gaugeMm: summed.gaugeMm,
    });
  }

  const months: TrendBucket[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const start = shiftMonth(monthStart, -i);
    const end = i === 0 ? today : lastDay(start);
    const summed = sumRange(input.days, input.gauge, start, end);
    const monthIndex = Number(start.slice(5, 7)) - 1;
    const year = start.slice(2, 4);
    months.push({
      key: start,
      label: i === 0 ? `${MONTHS[monthIndex]} so far` : `${MONTHS[monthIndex]} ’${year}`,
      rainMm: summed.rainMm,
      avgMaxC: summed.avgMaxC,
      gaugeMm: summed.gaugeMm,
    });
  }

  const thisYear = Number(today.slice(0, 4));
  const years: TrendBucket[] = [];
  for (let year = thisYear - 2; year <= thisYear; year += 1) {
    const start = `${year}-01-01`;
    const end = year === thisYear ? today : `${year}-12-31`;
    const summed = sumRange(input.days, input.gauge, start, end);
    years.push({
      key: String(year),
      label: year === thisYear ? `${year} so far` : String(year),
      rainMm: summed.rainMm,
      avgMaxC: summed.avgMaxC,
      gaugeMm: summed.gaugeMm,
    });
  }

  return { place: input.place, wow, mom, yoy, weeks, months, years };
}

function compare(title: string, current: TrendSpan, previous: TrendSpan): TrendCompare {
  return {
    title,
    current,
    previous,
    rainDeltaMm: current.rainMm - previous.rainMm,
    tempDeltaC:
      current.avgMaxC != null && previous.avgMaxC != null ? current.avgMaxC - previous.avgMaxC : null,
  };
}

function span(
  label: string,
  input: { days: Map<string, Day>; gauge: Map<string, number> },
  start: string,
  end: string,
): TrendSpan {
  const summed = sumRange(input.days, input.gauge, start, end);
  return { label, ...summed };
}

function sumRange(days: Map<string, Day>, gauge: Map<string, number>, start: string, end: string) {
  let rainMm = 0;
  let maxSum = 0;
  let maxN = 0;
  let minSum = 0;
  let minN = 0;
  let rainDays = 0;
  let gaugeMm = 0;
  let gaugeN = 0;
  if (start <= end) {
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const row = days.get(date);
      if (row?.rainMm != null) {
        rainMm += row.rainMm;
        if (row.rainMm >= 0.2) rainDays += 1;
      }
      if (row?.maxC != null) {
        maxSum += row.maxC;
        maxN += 1;
      }
      if (row?.minC != null) {
        minSum += row.minC;
        minN += 1;
      }
      const logged = gauge.get(date);
      if (logged != null) {
        gaugeMm += logged;
        gaugeN += 1;
      }
    }
  }
  return {
    rainMm,
    avgMaxC: maxN ? maxSum / maxN : null,
    avgMinC: minN ? minSum / minN : null,
    rainDays,
    gaugeMm: gaugeN ? gaugeMm : null,
  };
}

function mergeDays(older: Day[], newer: Day[]) {
  const days = new Map<string, Day>();
  for (const day of older) days.set(day.date, day);
  for (const day of newer) {
    if (day.rainMm == null && day.maxC == null) continue;
    days.set(day.date, day);
  }
  return days;
}

async function loadGauge(timezone: string, start: string) {
  const gauge = new Map<string, number>();
  if (!canPersistFarmData()) return gauge;
  const rows = await listObservations({
    domain: "rain",
    since: new Date(`${start}T00:00:00+05:30`),
    limit: 2000,
  }).catch(() => [] as ObservationRow[]);
  for (const row of rows) {
    const mm = row.details?.rainMm;
    if (mm == null || !Number.isFinite(Number(mm))) continue;
    const date = calendarDate(timezone, row.occurredAt);
    gauge.set(date, (gauge.get(date) ?? 0) + Number(mm));
  }
  return gauge;
}

async function fetchDaily(url: string): Promise<Day[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 21_600 }, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      daily?: {
        time?: string[];
        precipitation_sum?: Array<number | null>;
        temperature_2m_max?: Array<number | null>;
        temperature_2m_min?: Array<number | null>;
      };
    };
    return (
      data.daily?.time?.map((date, i) => ({
        date,
        rainMm: num(data.daily?.precipitation_sum?.[i]),
        maxC: num(data.daily?.temperature_2m_max?.[i]),
        minC: num(data.daily?.temperature_2m_min?.[i]),
      })) ?? []
    );
  } catch {
    return [];
  }
}

function archiveUrl(lat: number, lng: number, start: string, end: string, timezone: string) {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", end);
  url.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", timezone);
  return url.toString();
}

function recentUrl(lat: number, lng: number, timezone: string) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("past_days", "92");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", timezone);
  return url.toString();
}

function num(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function calendarDate(timezone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function diffDays(start: string, end: string) {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function mondayOnOrBefore(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const delta = weekday === 0 ? 6 : weekday - 1;
  return addDays(date, -delta);
}

function shiftMonth(monthStart: string, offset: number) {
  const year = Number(monthStart.slice(0, 4));
  const month = Number(monthStart.slice(5, 7)) - 1 + offset;
  const next = new Date(Date.UTC(year, month, 1));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function daysInMonth(monthStart: string) {
  const year = Number(monthStart.slice(0, 4));
  const month = Number(monthStart.slice(5, 7));
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function lastDay(monthStart: string) {
  return `${monthStart.slice(0, 7)}-${String(daysInMonth(monthStart)).padStart(2, "0")}`;
}

function sameDayLastYear(today: string) {
  const year = Number(today.slice(0, 4)) - 1;
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1) return `${year}-02-28`;
  return probe.toISOString().slice(0, 10);
}

function dayLabel(date: string) {
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
  return `${Number(date.slice(8, 10))} ${month}`;
}
