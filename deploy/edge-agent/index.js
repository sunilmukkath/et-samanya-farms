/**
 * Farm OS edge agent.
 * Subscribes to farm/+/tel/# and farm/+/cmd/#, buffers offline, POSTs to Farm OS ingest.
 * OTA: GET /api/farm/devices/:id/ota and republish to farm/{id}/ota
 */
import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://127.0.0.1:1883";
const FARM_OS_URL = (process.env.FARM_OS_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const TOKEN = process.env.FARM_EDGE_TOKEN || "";
const queue = [];
const MAX_QUEUE = 500;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  };
}

async function postIngest(body) {
  const res = await fetch(`${FARM_OS_URL}/api/farm/mqtt`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ingest ${res.status}`);
}

async function flush() {
  while (queue.length) {
    const item = queue[0];
    await postIngest(item);
    queue.shift();
  }
}

function enqueue(body) {
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(body);
}

const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 3000 });

client.on("connect", () => {
  console.log("edge-agent connected", MQTT_URL);
  client.subscribe("farm/+/tel/#");
  client.subscribe("farm/+/cmd/#");
  flush().catch((err) => console.error("flush", err));
});

client.on("message", (topic, payload) => {
  const parts = topic.split("/");
  const deviceId = parts[1];
  const kind = parts[2];
  const metric = parts.slice(3).join(".") || undefined;
  let value;
  let unit;
  let note;
  try {
    const parsed = JSON.parse(payload.toString());
    value = typeof parsed === "number" ? parsed : parsed.value;
    unit = parsed.unit;
    note = parsed.note;
  } catch {
    const n = Number(payload.toString());
    if (Number.isFinite(n)) value = n;
  }
  const body = {
    sensorId: deviceId,
    metric,
    value,
    unit,
    note,
    observation: kind === "cmd",
  };
  postIngest(body).catch(() => enqueue(body));
});

setInterval(() => {
  flush().catch(() => undefined);
}, 15000);
