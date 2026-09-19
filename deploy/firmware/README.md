# Companion firmware (ESP32 / LoRa) — not part of the Next.js app.

Shopping list and placement: [`deploy/hardware/README.md`](../hardware/README.md). Pair nodes in Farm OS → Nodes.

India radio: 865–867 MHz LoRa.

HTTP node (simplest first pond/soil node):

POST /api/farm/sensor
Authorization: Bearer <per-node token from Farm OS → Nodes>
Content-Type: application/json

{
  "metric": "pond.level_m",
  "value": 1.12,
  "unit": "m",
  "batteryV": 3.9,
  "rssi": -67
}

Add `"observation": true` or `"note": "..."` when you also want a coarsened log row.

MQTT node topics:

- telemetry: `farm/{deviceId}/tel/{metric}` payload `{"value": 18.2, "unit": "%"}`
- command: `farm/{deviceId}/cmd/pump` payload `{"command":"off"}`
- OTA: `farm/{deviceId}/ota` payload from GET `/api/farm/devices/{id}/ota`

Actuation safety: Farm OS refuses On if the node heartbeat is older than 5 minutes, and caps On at 15 minutes.
