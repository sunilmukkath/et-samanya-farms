import {
  AddDeviceForm,
  DevicePhotoForm,
  DeviceSettingsForm,
  MotorSwitch,
  RemoveDeviceButton,
  TokenRow,
} from "@/components/admin/KitForms";
import { listDevices, listReadings } from "@/db/queries";
import { kindMeta, liveStatus, metricLine, starterTotals } from "@/lib/equipment";
import { timeAgo } from "@/lib/farm";
import { site } from "@/lib/site";
import type { DeviceRow, ReadingRow } from "@/db/schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminKitPage() {
  const [devices, readings] = await Promise.all([listDevices(), listReadings({ limit: 24 })]);
  const ingestUrl = `${site.url.replace(/\/$/, "")}/api/devices/ingest`;
  const byId = Object.fromEntries(devices.map((row) => [row.id, row]));
  const phases = starterTotals();

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Farm kit</p>
      <h1 className="font-display text-4xl">Yes — sensors, motors, CCTV, and a drone can join this log.</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">
        Not by plugging a camera into the website. A small box on the plot reads the hardware
        and posts to this app. The phone you already walk with still does GPS, photos, and
        weather. New kit is for what the walk cannot see every hour.
      </p>

      <section className="mt-5 rounded-3xl bg-leaf-deep px-5 py-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">Thenkulapakkam, 5 acres</p>
        <p className="mt-2 font-display text-2xl">You already have solar pump and drip. Buy around that.</p>
        <p className="mt-2 text-sm leading-relaxed text-sand">
          Do not replace the pump with a Wi-Fi plug. Do not buy ultrasonic for a sixteen-foot
          pond. Start with a 4G link and soil/rain/pond, then valves, then cameras, then a nano
          drone.
        </p>
      </section>

      <OnThePlot devices={devices} />

      <section className="mt-8">
        <h2 className="font-display text-3xl">What to buy</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Street prices in Tamil Nadu, not a shop invoice. Add a line to the kit when you
          decide to purchase — that creates the ingest token the box will use.
        </p>
        <div className="mt-4 space-y-6">
          {phases.map((phase) => (
            <div key={phase.phase} className="rounded-3xl border border-line bg-white p-4">
              <p className="font-tamil text-xs text-muted">{phase.tamil}</p>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">
                  Phase {phase.phase}: {phase.title}
                </h3>
                <p className="shrink-0 text-sm font-semibold text-leaf-deep">{phase.budget}</p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{phase.summary}</p>
              <ul className="mt-4 space-y-4">
                {phase.items.map((item) => {
                  const already = devices.some((row) => row.model === item.id);
                  return (
                    <li key={item.id} className="border-t border-line pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {kindMeta[item.kind].label} · {item.qty}
                      </p>
                      <p className="font-display text-xl leading-tight">{item.name}</p>
                      <p className="text-sm font-semibold text-leaf-deep">{item.inr}</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.why}</p>
                      <p className="mt-1 text-sm text-ink">
                        <span className="font-semibold">Buy: </span>
                        {item.buy}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        <span className="font-semibold text-ink">Hooks to the app: </span>
                        {item.connectsHow}
                      </p>
                      {item.skip ? <p className="mt-1 text-sm text-clay">{item.skip}</p> : null}
                      <div className="mt-3">
                        {already ? (
                          <p className="text-sm font-semibold text-leaf-deep">Already in the farm kit.</p>
                        ) : (
                          <AddDeviceForm preset={{ catalogId: item.id, kind: item.kind, name: item.name }} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-3xl">On this farm</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Register a device, put the token on the ESP32 or camera script, and POST JSON to{" "}
          <code className="break-all text-xs">{ingestUrl}</code>
        </p>

        <div className="mt-4 rounded-3xl border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Register something extra</p>
          <div className="mt-3">
            <AddDeviceForm />
          </div>
        </div>

        {devices.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            Nothing registered yet. Add Phase 1 from the list above when the first box is on the way.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                ingestUrl={ingestUrl}
                readings={readings.filter((row) => row.deviceId === device.id).slice(0, 4)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-cream px-5 py-5">
        <h2 className="font-display text-2xl">How a box talks to this app</h2>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-leaf-deep p-4 text-xs leading-relaxed text-sand">
{`curl -X POST ${ingestUrl} \\
  -H "Authorization: Bearer DEVICE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"moisture":22.4,"battery":91,"tempC":29}'`}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          The same POST returns <code>command.action</code> as <code>on</code> or{" "}
          <code>off</code> for motors. The website never switches mains. The board on the farm
          does, through a contactor. Cameras can send <code>photoBase64</code>; drones can upload
          stills on this page after the flight.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Live CCTV walls stay in the NVR or vendor app. This log keeps the last still and a
          link. That is enough to know the pond camera is up without building a video proxy.
        </p>
      </section>

      {readings.length ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Latest packets</h2>
          <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white">
            {readings.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {timeAgo(row.occurredAt)} · {byId[row.deviceId]?.name ?? "Device"}
                </p>
                <p className="mt-1">{row.note || metricLine(row.metrics) || "Ping"}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-sm text-ink-soft">
        Still walking the rows?{" "}
        <Link href="/admin/log" className="font-semibold text-leaf underline-draw">
          Log by hand
        </Link>
        {" · "}
        <Link href="/admin/map" className="font-semibold text-leaf underline-draw">
          Tree map
        </Link>
      </p>
    </div>
  );
}

function OnThePlot({ devices }: { devices: DeviceRow[] }) {
  if (!devices.length) return null;
  const online = devices.filter((row) => liveStatus(row) === "online").length;
  const queuedOn = devices.filter((row) => row.kind === "motor" && row.desiredState === "on").length;

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      <Stat label="In the kit" value={String(devices.length)} />
      <Stat label="Heard recently" value={String(online)} />
      <Stat label="Motors queued on" value={String(queuedOn)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white px-4 py-4">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function DeviceCard({
  device,
  ingestUrl,
  readings,
}: {
  device: DeviceRow;
  ingestUrl: string;
  readings: ReadingRow[];
}) {
  const status = liveStatus(device);
  const meta = kindMeta[device.kind];
  const metrics = metricLine(device.lastMetrics);

  return (
    <li className="rounded-3xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-tamil text-xs text-muted">{meta.tamil}</p>
          <h3 className="font-display text-2xl leading-tight">{device.name}</h3>
          <p className="text-xs text-ink-soft">
            {meta.label}
            {device.zone ? ` · ${device.zone}` : ""} · {status}
            {device.lastSeenAt ? ` · ${timeAgo(device.lastSeenAt)}` : " · not heard yet"}
          </p>
        </div>
        <RemoveDeviceButton id={device.id} name={device.name} />
      </div>
      {metrics ? <p className="mt-2 text-sm">{metrics}</p> : null}
      {device.snapshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={device.snapshotUrl} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />
      ) : null}
      {device.streamUrl ? (
        <a
          href={device.streamUrl}
          className="mt-2 inline-block text-sm font-semibold text-leaf underline-draw"
          target="_blank"
          rel="noreferrer"
        >
          Open live view
        </a>
      ) : null}

      <div className="mt-4 space-y-4">
        {device.kind === "motor" ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Desired {device.desiredState ?? "off"} · reported {device.reportedState ?? "—"}
            </p>
            <MotorSwitch id={device.id} desiredState={device.desiredState} />
            <p className="mt-2 text-xs text-ink-soft">
              Queues a command. The farm board must still drive a contactor, not the website.
            </p>
          </div>
        ) : null}

        {device.kind === "camera" || device.kind === "drone" ? (
          <DevicePhotoForm id={device.id} kind={device.kind} />
        ) : null}

        <DeviceSettingsForm
          id={device.id}
          streamUrl={device.streamUrl}
          note={device.note}
          zone={device.zone}
        />

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Ingest token</p>
          <TokenRow id={device.id} token={device.token} />
          <p className="mt-2 break-all font-mono text-[11px] text-muted">POST {ingestUrl}</p>
        </div>

        {readings.length ? (
          <ul className="space-y-1 text-xs text-ink-soft">
            {readings.map((row) => (
              <li key={row.id}>
                {timeAgo(row.occurredAt)} · {row.note || metricLine(row.metrics) || "Ping"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
