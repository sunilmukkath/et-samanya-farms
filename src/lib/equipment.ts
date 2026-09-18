export const deviceKinds = ["gateway", "sensor", "motor", "camera", "drone"] as const;
export type DeviceKind = (typeof deviceKinds)[number];

export const deviceStatuses = ["planned", "online", "offline", "error"] as const;
export type DeviceStatus = (typeof deviceStatuses)[number];

export type MetricValue = number | string | boolean | null;
export type DeviceMetrics = Record<string, MetricValue>;

export const kindMeta: Record<
  DeviceKind,
  { label: string; tamil: string; hint: string }
> = {
  gateway: { label: "Gateway", tamil: "நுழைவாயில்", hint: "The box that talks to this app" },
  sensor: { label: "Sensor", tamil: "உணரி", hint: "Soil, rain, pond, air" },
  motor: { label: "Motor / valve", tamil: "மோட்டார்", hint: "Pump, solenoid, starter" },
  camera: { label: "CCTV", tamil: "கேமரா", hint: "Snapshot or NVR link" },
  drone: { label: "Drone", tamil: "ட்ரோன்", hint: "Geotagged stills from the air" },
};

export type KitItem = {
  id: string;
  kind: DeviceKind;
  phase: 1 | 2 | 3 | 4;
  name: string;
  qty: string;
  inr: string;
  buy: string;
  why: string;
  connectsHow: string;
  skip?: string;
};

export const kitPhases: {
  phase: 1 | 2 | 3 | 4;
  title: string;
  tamil: string;
  budget: string;
  summary: string;
}[] = [
  {
    phase: 1,
    title: "See the land",
    tamil: "பார்",
    budget: "₹25,000–45,000",
    summary: "A 4G link, one gateway, soil probes, a rain gauge, and a pond-level sensor. Readings show up in this log.",
  },
  {
    phase: 2,
    title: "Steer the drip",
    tamil: "நீர்",
    budget: "₹15,000–35,000",
    summary: "Keep the solar pump. Add valves and a proper starter so this app can queue on/off — a local box still throws the switch.",
  },
  {
    phase: 3,
    title: "Watch the plot",
    tamil: "காவல்",
    budget: "₹40,000–80,000",
    summary: "Four to six outdoor cameras. 4G solar if you do not want to trench cable; PoE NVR if you will run CAT6 from the farmhouse.",
  },
  {
    phase: 4,
    title: "Fly the canopy",
    tamil: "வானம்",
    budget: "₹90,000–1,20,000",
    summary: "A nano drone for canopy and census photos. Stills upload here. Mapping software can wait.",
  },
];

export const kitItems: KitItem[] = [
  {
    id: "4g-router",
    kind: "gateway",
    phase: 1,
    name: "4G router at the farmhouse",
    qty: "1",
    inr: "₹3,000–8,000 + SIM",
    buy: "Jio/Airtel 4G router with an outdoor antenna if the house sits in a dip. A normal data SIM is enough; IoT SIMs are optional.",
    why: "Five acres will not have Wi-Fi to the far trees. The kit talks to this website over mobile data.",
    connectsHow: "The gateway uses this network. Nothing else on the plot needs a public IP.",
  },
  {
    id: "esp32-gateway",
    kind: "gateway",
    phase: 1,
    name: "Farm gateway (ESP32 or equivalent)",
    qty: "1–2 boards + IP65 box",
    inr: "₹1,500–4,000",
    buy: "ESP32-WROOM or ESP32-S3 in a waterproof box, with a 5 V / 12 V solar trickle on remote nodes. Heltec/LilyGo LoRa if probes sit far from the house.",
    why: "The website cannot speak RS-485 or a pump contactor. This small board reads sensors, posts JSON, and obeys motor commands.",
    connectsHow: "POST /api/devices/ingest with the device token. The response includes any pending pump/valve command.",
  },
  {
    id: "soil-probe",
    kind: "sensor",
    phase: 1,
    name: "Soil moisture probes",
    qty: "6–8",
    inr: "₹1,500–3,000 each",
    buy: "Capacitive or RS-485 soil probes (DFRobot SEN0308 class, or a local RS-485 3-in-1). Skip the two-prong metal sticks — they rot in a season.",
    why: "Horticulture, beds, and a few tree lines. Cheap NPK pens lie; moisture is the number that changes irrigation.",
    connectsHow: "Gateway reads analog or Modbus, then posts { moisture, tempC, battery }.",
    skip: "Skip ₹500 'NPK Bluetooth' probes. They are not a lab.",
  },
  {
    id: "rain-gauge",
    kind: "sensor",
    phase: 1,
    name: "Tipping-bucket rain gauge",
    qty: "1",
    inr: "₹2,000–8,000",
    buy: "A 0.2 mm tipping bucket with a reed switch, mounted in the open, not under the canopy. Ecowitt-style stations are fine if they can HTTP out.",
    why: "Open-Meteo is a sky model. A gauge on East Street is what the pond actually received.",
    connectsHow: "Count tips, post { rainMm } every hour or after a storm.",
  },
  {
    id: "pond-level",
    kind: "sensor",
    phase: 1,
    name: "Pond level (pressure, not ultrasonic)",
    qty: "1",
    inr: "₹3,000–8,000",
    buy: "Submersible 4–20 mA or RS-485 pressure transducer, 0–5 m or 0–10 m range, with a stilling tube.",
    why: "The Sensei pond is about sixteen feet at the deep. Cheap ultrasonic rangers top out near 4.5 m and hate sun and humidity.",
    connectsHow: "Gateway scales mA to centimetres and posts { pondCm, pondLevel }.",
    skip: "Do not buy JSN-SR04T as the only pond sensor.",
  },
  {
    id: "weather-optional",
    kind: "sensor",
    phase: 1,
    name: "Optional weather head",
    qty: "1",
    inr: "₹12,000–25,000",
    buy: "Ecowitt GW2000 + outdoor head, or a Davis if budget allows. Only if you want wind and humidity on the plot, not from the forecast.",
    why: "Nice, not first. The phone log plus Open-Meteo already covers a walk.",
    connectsHow: "If the station can webhook or the gateway can scrape it, post { tempC, humidity, windKmh }.",
  },
  {
    id: "valve-kit",
    kind: "motor",
    phase: 2,
    name: "24 V AC drip solenoids",
    qty: "4–6 zones",
    inr: "₹800–2,000 each + transformer",
    buy: "Standard irrigation solenoids and a 24 V AC transformer. One valve per drip zone (trees, horticulture, beds).",
    why: "The farm already has solar pump and drip. Valves are how you place water without flooding the plot because the pump is on.",
    connectsHow: "ESP32 drives a relay board → valve coil. This app queues on/off. The board, not the website, switches 24 V.",
  },
  {
    id: "pump-starter",
    kind: "motor",
    phase: 2,
    name: "Pump contactor / dry-run protection",
    qty: "1 panel",
    inr: "₹2,000–6,000",
    buy: "A proper motor starter or contactor with overload, plus a current sensor. If the solar pump inverter already has a dry contact or RS-485, use that instead of a new box.",
    why: "Never put a hobby relay or a Wi-Fi plug on the pump mains. The existing solar pump is the expensive part — talk to it, do not replace it.",
    connectsHow: "Gateway closes a dry contact the inverter/starter already expects. App sets desiredState; board reports on/off and currentA.",
    skip: "No Tuya plugs, no 10 A Arduino relays on the pump.",
  },
  {
    id: "float-switch",
    kind: "sensor",
    phase: 2,
    name: "Tank / canal float switch",
    qty: "1–2",
    inr: "₹400–1,200",
    buy: "A sealed float or dual-level switch on the tank that the solar pump fills.",
    why: "Stops the pump when the tank is full, independent of the app.",
    connectsHow: "Wired to the starter as hardware interlock, and optionally posted as { tankFull: true }.",
  },
  {
    id: "camera-4g",
    kind: "camera",
    phase: 3,
    name: "4G solar cameras (no trench)",
    qty: "4–6",
    inr: "₹8,000–18,000 each",
    buy: "Outdoor 4G cameras with a solar panel (Imou Cell / CP Plus 4G / similar) at the house, pond, cattle, and two field corners.",
    why: "Five acres is a long CAT6 run. 4G cameras stand up without a trench. Live view stays in the vendor app; this log wants a still.",
    connectsHow: "Prefer cameras that can HTTP a snapshot, or a small script on the NVR that POSTs a JPEG to ingest. Store the vendor app link as stream URL.",
  },
  {
    id: "camera-poe",
    kind: "camera",
    phase: 3,
    name: "PoE NVR kit (if you will pull cable)",
    qty: "8-channel NVR + 6 bullets",
    inr: "₹40,000–80,000",
    buy: "Hikvision, Dahua, or CP Plus PoE NVR, outdoor bullets, a small PoE switch, outdoor CAT6 from the farmhouse. RTSP is the feature that matters.",
    why: "Better picture and a real archive. Worth it once the house is the wiring hub.",
    connectsHow: "RTSP/snapshot URL on the device. Live wall stays on the NVR; this app shows the last still.",
  },
  {
    id: "drone-nano",
    kind: "drone",
    phase: 4,
    name: "Nano drone (under 250 g)",
    qty: "1 airframe + 2 extra batteries",
    inr: "₹80,000–1,10,000",
    buy: "DJI Mini 4 Pro or current nano-class equivalent. Landing pad, ND filters, spare props. Fly in the DGCA green zone; nano craft still follow no-fly rules.",
    why: "Canopy, pond, and census stills from the air. A 5-acre map does not need a ₹8 lakh multispectral rig.",
    connectsHow: "Upload geotagged JPEGs on this page. They sit on the drone device and can be pinned on the tree map later.",
    skip: "Skip spraying drones and heavy RTK kits until the census walk is done.",
  },
];

export function isDeviceKind(value: string): value is DeviceKind {
  return deviceKinds.includes(value as DeviceKind);
}

export function kitItemById(id: string) {
  return kitItems.find((item) => item.id === id) ?? null;
}

export function liveStatus(input: {
  status: DeviceStatus;
  lastSeenAt?: Date | string | null;
}): DeviceStatus {
  if (input.status === "error") return input.status;
  if (!input.lastSeenAt) return input.status === "online" ? "offline" : input.status;
  const seen = new Date(input.lastSeenAt).getTime();
  if (Number.isNaN(seen)) return "offline";
  const twoHours = 2 * 60 * 60 * 1000;
  return Date.now() - seen > twoHours ? "offline" : "online";
}

export function newDeviceToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const METRIC_LABELS: Record<string, { label: string; suffix?: string }> = {
  moisture: { label: "Moisture", suffix: "%" },
  tempC: { label: "Temp", suffix: "°" },
  humidity: { label: "Humidity", suffix: "%" },
  rainMm: { label: "Rain", suffix: " mm" },
  pondCm: { label: "Pond", suffix: " cm" },
  pondLevel: { label: "Pond" },
  battery: { label: "Battery", suffix: "%" },
  windKmh: { label: "Wind", suffix: " km/h" },
  currentA: { label: "Current", suffix: " A" },
  tankFull: { label: "Tank" },
};

export function formatMetric(key: string, value: MetricValue) {
  if (value == null || value === "") return null;
  const meta = METRIC_LABELS[key];
  const printed =
    typeof value === "number"
      ? Number.isInteger(value)
        ? String(value)
        : value.toFixed(1)
      : typeof value === "boolean"
        ? value
          ? "yes"
          : "no"
        : String(value);
  if (!meta) return `${key} ${printed}`;
  return `${meta.label} ${printed}${meta.suffix ?? ""}`;
}

export function metricLine(metrics: DeviceMetrics | null | undefined) {
  if (!metrics) return "";
  return Object.entries(metrics)
    .map(([key, value]) => formatMetric(key, value))
    .filter(Boolean)
    .join(" · ");
}

export function starterTotals() {
  return kitPhases.map((phase) => ({
    ...phase,
    items: kitItems.filter((item) => item.phase === phase.phase),
  }));
}
