"use server";

import { revalidatePath } from "next/cache";
import {
  canPersistFarmData,
  deleteDevice,
  getDevice,
  insertDevice,
  insertReading,
  updateDevice,
} from "@/db/queries";
import { requireAdmin } from "@/lib/admin";
import { isDeviceKind, kitItemById, newDeviceToken } from "@/lib/equipment";
import { uploadPhoto } from "@/lib/photos";

function revalidateKit() {
  revalidatePath("/admin");
  revalidatePath("/admin/kit");
}

function str(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function num(form: FormData, key: string) {
  const value = str(form, key);
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function persistError() {
  return { ok: false as const, error: "Add DATABASE_URL to save kit data on Vercel." };
}

export async function addDeviceAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();

  const catalogId = str(formData, "catalogId");
  const catalog = catalogId ? kitItemById(catalogId) : null;
  const kindRaw = str(formData, "kind") || catalog?.kind || "";
  if (!isDeviceKind(kindRaw)) return { ok: false as const, error: "Pick a kind of equipment." };

  const name = str(formData, "name") || catalog?.name;
  if (!name) return { ok: false as const, error: "Name the device." };

  const device = await insertDevice({
    kind: kindRaw,
    name,
    zone: str(formData, "zone") || null,
    vendor: str(formData, "vendor") || null,
    model: str(formData, "model") || catalog?.id || null,
    token: newDeviceToken(),
    status: "planned",
    lastSeenAt: null,
    lastMetrics: null,
    desiredState: kindRaw === "motor" ? "off" : null,
    reportedState: null,
    streamUrl: str(formData, "streamUrl") || null,
    snapshotUrl: null,
    note: str(formData, "note") || catalog?.buy || null,
    lat: num(formData, "lat"),
    lng: num(formData, "lng"),
  });

  revalidateKit();
  return { ok: true as const, id: device.id, token: device.token };
}

export async function setMotorAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  const state = str(formData, "desiredState");
  if (!id) return { ok: false as const, error: "Missing device." };
  if (state !== "on" && state !== "off") {
    return { ok: false as const, error: "Choose on or off." };
  }
  const device = await getDevice(id);
  if (!device || device.kind !== "motor") {
    return { ok: false as const, error: "That is not a motor or valve." };
  }
  await updateDevice(id, { desiredState: state });
  revalidateKit();
  return { ok: true as const };
}

export async function uploadDevicePhotoAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  const device = id ? await getDevice(id) : null;
  if (!device) return { ok: false as const, error: "Missing device." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose a photo." };
  }
  const photoUrl = await uploadPhoto(file);
  const lat = num(formData, "lat");
  const lng = num(formData, "lng");
  await insertReading({
    deviceId: device.id,
    occurredAt: new Date(),
    metrics: {},
    photoUrl,
    note: str(formData, "note") || (device.kind === "drone" ? "Drone still" : "Camera still"),
    lat,
    lng,
  });
  await updateDevice(device.id, {
    status: "online",
    lastSeenAt: new Date(),
    snapshotUrl: photoUrl,
    lat: lat ?? device.lat,
    lng: lng ?? device.lng,
  });
  revalidateKit();
  return { ok: true as const };
}

export async function saveDeviceLinksAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  if (!id) return { ok: false as const, error: "Missing device." };
  await updateDevice(id, {
    streamUrl: str(formData, "streamUrl") || null,
    note: str(formData, "note") || null,
    zone: str(formData, "zone") || null,
  });
  revalidateKit();
  return { ok: true as const };
}

export async function rotateDeviceTokenAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  if (!id) return { ok: false as const, error: "Missing device." };
  const token = newDeviceToken();
  await updateDevice(id, { token });
  revalidateKit();
  return { ok: true as const, token };
}

export async function removeDeviceAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  if (!id) return { ok: false as const, error: "Missing device." };
  await deleteDevice(id);
  revalidateKit();
  return { ok: true as const };
}
