export type SatelliteLook = {
  when: string;
  cloud: number | null;
};

export async function latestSatelliteLook(lat: number, lng: number): Promise<SatelliteLook | null> {
  const pad = 0.02;
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 86_400_000);
  try {
    const res = await fetch("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: ["sentinel-2-l2a"],
        bbox: [lng - pad, lat - pad, lng + pad, lat + pad],
        datetime: `${start.toISOString()}/${end.toISOString()}`,
        limit: 1,
        query: { "eo:cloud_cover": { lt: 60 } },
        sortby: [{ field: "datetime", direction: "desc" }],
      }),
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 43_200 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      features?: { properties?: { datetime?: string; "eo:cloud_cover"?: number } }[];
    };
    const props = body.features?.[0]?.properties;
    if (!props?.datetime) return null;
    const when = new Date(props.datetime);
    if (Number.isNaN(when.getTime())) return null;
    const cloud = typeof props["eo:cloud_cover"] === "number" ? Math.round(props["eo:cloud_cover"]) : null;
    return {
      when: when.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      cloud,
    };
  } catch {
    return null;
  }
}
