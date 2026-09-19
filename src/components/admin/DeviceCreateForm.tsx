"use client";

import { createDeviceAction } from "@/app/admin/actions";
import { useState, useTransition } from "react";

export function DeviceCreateForm({ plots }: { plots: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-3xl border border-line bg-white p-4"
      action={(formData) => {
        setError(null);
        start(async () => {
          const result = await createDeviceAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setToken(result.token);
        });
      }}
    >
      <input name="name" required placeholder="Node name" className="tap w-full rounded-2xl border border-line px-3" />
      <select name="kind" className="tap w-full rounded-2xl border border-line px-3">
        {["soil", "pond", "tank", "weather", "pump", "valve", "camera", "counter"].map((kind) => (
          <option key={kind} value={kind}>
            {kind}
          </option>
        ))}
      </select>
      <select name="protocol" className="tap w-full rounded-2xl border border-line px-3">
        <option value="http">HTTP</option>
        <option value="mqtt">MQTT</option>
        <option value="lora">LoRa</option>
      </select>
      {plots.length ? (
        <select name="plotId" className="tap w-full rounded-2xl border border-line px-3">
          <option value="">Plot (optional)</option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name}
            </option>
          ))}
        </select>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <input name="lat" placeholder="Lat" inputMode="decimal" className="tap w-full rounded-2xl border border-line px-3" />
        <input name="lng" placeholder="Lng" inputMode="decimal" className="tap w-full rounded-2xl border border-line px-3" />
      </div>
      <button type="submit" disabled={pending} className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream">
        {pending ? "Pairing…" : "Pair node"}
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {token ? (
        <p className="break-all rounded-2xl bg-cream px-3 py-3 text-sm">
          Copy this token now. It will not be shown again.
          <br />
          <code>{token}</code>
        </p>
      ) : null}
    </form>
  );
}
