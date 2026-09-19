import type { DeviceKind, DeviceProtocol } from "@/db/schema";

export type HardwareWave = "have" | "first" | "next" | "skip";

export type HardwareItem = {
  id: string;
  wave: HardwareWave;
  name: string;
  qty: string;
  role: string;
  kind?: DeviceKind;
  protocol?: DeviceProtocol;
  metric?: string;
  radioNote?: string;
};

/** 4-acre Samanya kit. Phones first; then one hub and four node types. */
export const samanyaHardwareKit: HardwareItem[] = [
  {
    id: "phone",
    wave: "have",
    name: "Farm Android + rain pouch + 20,000 mAh bank",
    qty: "1–2",
    role: "GPS, camera, voice, Gemini. The AI app already runs here.",
  },
  {
    id: "hub",
    wave: "first",
    name: "Raspberry Pi 5 (8 GB) + SSD, or a small NUC",
    qty: "1",
    role: "Always-on gateway: MQTT, buffer when WAN dies, later OTA.",
  },
  {
    id: "lora-gw",
    wave: "first",
    name: "LoRa concentrator / WisGate, 865–867 MHz",
    qty: "1",
    role: "Mesh radio for the whole 4 acres. Do not buy EU 868 modules.",
    radioNote: "India 865–867 MHz",
  },
  {
    id: "uplink",
    wave: "first",
    name: "4G/5G router + farm SIM",
    qty: "1",
    role: "Uplink if the house has no stable broadband.",
  },
  {
    id: "ups",
    wave: "first",
    name: "UPS or inverter tap",
    qty: "1",
    role: "Gateway must survive load-shedding.",
  },
  {
    id: "pond",
    wave: "first",
    name: "Pond node: ESP32 + LoRa + JSN-SR04T + IP65 + 6 W solar + 18650",
    qty: "1",
    role: "Sensei pond level.",
    kind: "pond",
    protocol: "lora",
    metric: "pond.level_m",
  },
  {
    id: "soil",
    wave: "first",
    name: "Soil node: ESP32 + LoRa + capacitive moisture + soil temp + solar",
    qty: "4",
    role: "Horticulture, solo crop, north belt, south belt. Capacitive only.",
    kind: "soil",
    protocol: "lora",
    metric: "soil.moisture_pct",
  },
  {
    id: "weather",
    wave: "first",
    name: "Tipping-bucket rain gauge + BME280 on the hub pole",
    qty: "1",
    role: "Ground-truth rain vs Open-Meteo.",
    kind: "weather",
    protocol: "mqtt",
    metric: "rain.mm",
  },
  {
    id: "pump",
    wave: "first",
    name: "Pump node: dry-contact or CT clamp on solar pump / starter",
    qty: "1",
    role: "kit pumpOn. Observe first; rules later.",
    kind: "pump",
    protocol: "lora",
    metric: "pump.on",
  },
  {
    id: "tank",
    wave: "first",
    name: "Tank node (ultrasonic or pressure)",
    qty: "0–1",
    role: "Only if the overhead tank is not visible from the pond sensor.",
    kind: "tank",
    protocol: "lora",
    metric: "tank.level_m",
  },
  {
    id: "soil-more",
    wave: "next",
    name: "Two more soil nodes",
    qty: "2",
    role: "Only if the first four disagree with the hoe.",
    kind: "soil",
    protocol: "lora",
    metric: "soil.moisture_pct",
  },
  {
    id: "camera",
    wave: "next",
    name: "Outdoor IP camera on pond or pump house",
    qty: "1",
    role: "Not ESP32-CAM.",
    kind: "camera",
    protocol: "http",
  },
  {
    id: "cattle",
    wave: "next",
    name: "Ear tags + handheld reader",
    qty: "herd",
    role: "Skip until the herd is a daily workflow.",
  },
  {
    id: "drone",
    wave: "next",
    name: "DJI Mini (or similar) 1–2 flights a year",
    qty: "1",
    role: "Mapping for FARM_DRONE_TILE_URL — not a mesh node.",
  },
  {
    id: "resistive",
    wave: "skip",
    name: "Resistive soil forks",
    qty: "0",
    role: "Die in wet Tamil soil.",
  },
  {
    id: "eu-lora",
    wave: "skip",
    name: "EU-only 868 MHz LoRaWAN gateways",
    qty: "0",
    role: "Wrong band for India.",
  },
  {
    id: "auto-irrig",
    wave: "skip",
    name: "Full auto-irrigation controller",
    qty: "0",
    role: "Fights the existing solar pump. Actuation is Phase E.",
  },
];

export const firstPairNodes = samanyaHardwareKit.filter(
  (item) => item.wave === "first" && item.kind,
);

export const hardwareRecurring = [
  { name: "Farm 4G SIM", note: "~₹200–400 / month" },
  { name: "Gemini API", note: "Vision + briefs" },
  { name: "Postgres host", note: "Railway or compose Timescale, once readings exist" },
];
