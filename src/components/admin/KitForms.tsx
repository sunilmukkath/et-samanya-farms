"use client";

import {
  addDeviceAction,
  removeDeviceAction,
  rotateDeviceTokenAction,
  saveDeviceLinksAction,
  setMotorAction,
  uploadDevicePhotoAction,
} from "@/app/admin/kit-actions";
import { deviceKinds, kindMeta, type DeviceKind } from "@/lib/equipment";
import { zoneLabels } from "@/lib/farm";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const fieldClass =
  "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

export function AddDeviceForm({ preset }: { preset?: { catalogId: string; kind: DeviceKind; name: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        setMessage(null);
        start(async () => {
          const result = await addDeviceAction(formData);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setToken(result.token);
          router.refresh();
        });
      }}
    >
      {preset ? <input type="hidden" name="catalogId" value={preset.catalogId} /> : null}
      {preset ? <input type="hidden" name="kind" value={preset.kind} /> : null}
      {preset ? <input type="hidden" name="name" value={preset.name} /> : null}

      {!preset ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Kind</span>
            <select name="kind" className={fieldClass} defaultValue="sensor">
              {deviceKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kindMeta[kind].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Name</span>
            <input name="name" required placeholder="Pond level" className={fieldClass} />
          </label>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Zone</span>
          <select name="zone" className={fieldClass} defaultValue="">
            <option value="">Whole farm</option>
            {zoneLabels.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        {preset?.kind === "camera" || !preset ? (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Camera / NVR link
            </span>
            <input name="streamUrl" placeholder="https://…" className={fieldClass} />
          </label>
        ) : null}
      </div>

      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}
      {token ? (
        <p className="break-all rounded-2xl bg-cream px-3 py-2 text-xs text-ink-soft">
          Ingest token: <code className="font-semibold text-ink">{token}</code>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="tap inline-flex items-center rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream disabled:opacity-60"
      >
        {pending ? "Saving…" : preset ? "Add to farm kit" : "Register device"}
      </button>
    </form>
  );
}

export function MotorSwitch({ id, desiredState }: { id: string; desiredState: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const on = desiredState === "on";

  function send(state: "on" | "off") {
    const form = new FormData();
    form.set("id", id);
    form.set("desiredState", state);
    start(async () => {
      await setMotorAction(form);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => send("on")}
        className={`tap rounded-full px-4 text-sm font-semibold ${on ? "bg-leaf text-leaf-deep" : "border border-line bg-white"}`}
      >
        Queue on
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => send("off")}
        className={`tap rounded-full px-4 text-sm font-semibold ${!on ? "bg-leaf-deep text-cream" : "border border-line bg-white"}`}
      >
        Queue off
      </button>
    </div>
  );
}

export function DevicePhotoForm({ id, kind }: { id: string; kind: DeviceKind }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      action={(formData) => {
        setMessage(null);
        start(async () => {
          const result = await uploadDevicePhotoAction(formData);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {kind === "drone" ? "Drone still" : "Snapshot"}
        </span>
        <input name="photo" type="file" accept="image/*" required className={fieldClass} />
      </label>
      <input name="note" placeholder="Optional note" className={fieldClass} />
      {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="tap rounded-full bg-leaf-deep px-4 text-sm font-semibold text-cream disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Save photo"}
      </button>
    </form>
  );
}

export function DeviceSettingsForm({
  id,
  streamUrl,
  note,
  zone,
}: {
  id: string;
  streamUrl: string | null;
  note: string | null;
  zone: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-2 sm:grid-cols-2"
      action={(formData) => {
        start(async () => {
          await saveDeviceLinksAction(formData);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Zone</span>
        <select name="zone" defaultValue={zone ?? ""} className={fieldClass}>
          <option value="">Whole farm</option>
          {zoneLabels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Live view link</span>
        <input name="streamUrl" defaultValue={streamUrl ?? ""} placeholder="NVR or camera app URL" className={fieldClass} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Note</span>
        <input name="note" defaultValue={note ?? ""} className={fieldClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="tap rounded-full border border-line px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function TokenRow({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-2">
      <p className="break-all font-mono text-xs text-ink-soft">{token}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="tap rounded-full border border-line px-4 text-xs font-semibold"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(token);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy token"}
        </button>
        <form
          action={(formData) => {
            start(async () => {
              await rotateDeviceTokenAction(formData);
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="tap rounded-full border border-line px-4 text-xs font-semibold disabled:opacity-60"
          >
            {pending ? "Rotating…" : "New token"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function RemoveDeviceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!confirm(`Remove ${name} from the kit?`)) return;
        start(async () => {
          await removeDeviceAction(formData);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="tap text-xs font-semibold text-clay disabled:opacity-60">
        Remove
      </button>
    </form>
  );
}
