import { acknowledgeAlertAction, commandDeviceAction } from "@/app/admin/actions";
import Link from "next/link";
import { DeviceCreateForm } from "@/components/admin/DeviceCreateForm";
import { listAlerts, listDevices, listPlots, latestReadings, listReadings } from "@/db/queries";
import { timeAgo } from "@/lib/farm";
import { otaCommand } from "@/lib/iot/ota";

export default async function NodesPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string }>;
}) {
  const params = await searchParams;
  const [devices, readings, alerts, plots] = await Promise.all([
    listDevices(),
    latestReadings(),
    listAlerts(false),
    listPlots(),
  ]);
  const selected = devices.find((device) => device.id === params.device) ?? devices[0] ?? null;
  const history = selected ? await listReadings({ deviceId: selected.id, limit: 40 }) : [];
  const ota = selected ? await otaCommand(selected.id) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Nodes</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Register a sensor, bind it to a plot, and watch live readings. Commands only go to pumps/valves with a fresh heartbeat.{" "}
        <Link href="/admin/hardware" className="font-semibold text-leaf-deep underline decoration-sun underline-offset-4">
          4-acre kit
        </Link>
      </p>

      <div className="mt-5">
        <DeviceCreateForm plots={plots.map((plot) => ({ id: plot.id, name: plot.name }))} />
      </div>

      {alerts.length ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Alerts</h2>
          <ul className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-start justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-3">
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-ink-soft">{alert.detail}</p>
                </div>
                <form action={acknowledgeAlertAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <button type="submit" className="tap text-sm font-semibold text-leaf-deep">
                    Ack
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="mt-6 space-y-3">
        {devices.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            No nodes yet. Pair a pond or soil node first.
          </li>
        ) : (
          devices.map((device) => {
            const latest = readings.find((row) => row.deviceId === device.id);
            return (
              <li key={device.id}>
                <a href={`/admin/nodes?device=${device.id}`} className="block rounded-3xl border border-line bg-white px-4 py-4">
                  <p className="font-display text-2xl">{device.name}</p>
                  <p className="text-sm text-ink-soft">
                    {device.kind} · {device.protocol} · {device.status}
                    {latest ? ` · ${latest.metric} ${latest.value}${latest.unit ?? ""}` : ""}
                    {device.lastSeenAt ? ` · ${timeAgo(device.lastSeenAt)}` : ""}
                  </p>
                </a>
              </li>
            );
          })
        )}
      </ul>

      {selected ? (
        <section className="mt-8 rounded-3xl border border-line bg-white p-4">
          <h2 className="font-display text-2xl">{selected.name}</h2>
          <p className="text-sm text-ink-soft">
            Battery {selected.batteryV ?? "—"} V · RSSI {selected.rssi ?? "—"} · firmware {selected.firmware ?? "—"}
          </p>
          {selected.kind === "pump" || selected.kind === "valve" ? (
            <form action={commandDeviceAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={selected.id} />
              <button name="command" value="on" className="tap rounded-full bg-leaf-deep px-4 text-sm font-semibold text-cream">
                On
              </button>
              <button name="command" value="off" className="tap rounded-full border border-line px-4 text-sm font-semibold">
                Off
              </button>
            </form>
          ) : null}
          {ota ? (
            <p className="mt-3 text-sm text-ink-soft">
              OTA ready: {ota.payload.version} on topic <code>{ota.topic}</code>
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No firmware artifact registered for this kind yet.</p>
          )}
          <ul className="mt-4 space-y-1 text-sm">
            {history.slice(0, 12).map((row) => (
              <li key={`${row.id}-${row.recordedAt.toISOString()}`}>
                {timeAgo(row.recordedAt)} · {row.metric} {row.value}
                {row.unit ?? ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
