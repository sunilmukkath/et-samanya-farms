# 4-acre Samanya hardware kit

Phones already run Farm OS (GPS, camera, voice, Gemini). Buy a hub and a handful of nodes for live pond, soil, pump, and rain. Four acres with trees does **not** need a sensor grid.

India radio: **865–867 MHz LoRa**. Prefer **capacitive** soil probes.

Place the hub at house / store / tank (power + height). Four soil nodes cover horticulture, solo crop, and two tree-belt drip lines. Do not buy a probe per tree.

## Already enough for the AI app

- Mid-range Android that stays on the farm, rain pouch, 20,000 mAh power bank
- Gemini + Open-Meteo (already on every log)
- Optional second staff phone; QR stickers for plots once Nodes exist

## Buy first — hub + four node types (~₹50–80k)

| What | Qty | Farm OS role |
|------|-----|----------------|
| Raspberry Pi 5 (8 GB) + SSD, or a small NUC | 1 | MQTT gateway (`deploy/compose.yaml`) |
| LoRa concentrator / WisGate, **865 MHz** | 1 | Mesh for the 4 acres |
| 4G/5G router + farm SIM | 1 | Uplink if house broadband is weak |
| UPS or inverter tap | 1 | Survive load-shedding |
| Pond: ESP32 + LoRa + JSN-SR04T + IP65 + 6 W solar + 18650 | 1 | `pond.level_m` |
| Soil: ESP32 + LoRa + capacitive moisture + soil temp + solar | 4 | `soil.moisture_pct` |
| Tipping-bucket rain gauge + BME280 on the hub pole | 1 | `rain.mm` vs Open-Meteo |
| Pump: dry-contact or CT clamp | 1 | `pump.on` |
| Tank ultrasonic/pressure | 0–1 | `tank.level_m` if pond cannot see the tank |

Pair each node in Farm OS → **Nodes** (or the setup wizard). HTTP: `POST /api/farm/sensor` with the per-node Bearer token. MQTT: `farm/{deviceId}/tel/{metric}` via the edge agent.

## Buy next (~₹25–60k)

- Two more soil nodes only if the first four disagree with the hoe
- One outdoor IP camera on pond or pump house (not ESP32-CAM)
- Cattle ear tags + reader — or skip until the herd is daily work
- DJI Mini 1–2 flights a year for `FARM_DRONE_TILE_URL`
- LoRa relay on the pump **only after** observe + rules are trusted

## Do not buy

Resistive soil forks, one weather station per zone, satellite IoT, dendrometers on 1,600 trees, EU-only LoRaWAN gateways, or a full auto-irrigation controller that fights the solar pump.

## Recurring

- Farm 4G SIM (~₹200–400/month)
- Gemini API
- Postgres (Railway or the Timescale service in `deploy/compose.yaml`)

Firmware sketches live in a companion repo. Ingest and the gateway agent live in this website repo (`deploy/firmware/README.md`).
