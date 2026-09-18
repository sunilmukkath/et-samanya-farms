"use server";

import { revalidatePath } from "next/cache";
import {
  canPersistFarmData,
  getTree,
  insertObservation,
  insertTree,
  listObservations,
  nearbyTrees,
  saveFarmBoundary,
  updateTree,
  upsertSpecies,
} from "@/db/queries";
import type {
  AiSuggestion,
  GeoPolygon,
  ObservationDetails,
  ObservationDomain,
  TreeHabit,
  TreeHealth,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { isObservationDomain } from "@/lib/farm";
import { uploadPhoto } from "@/lib/photos";
import { suggestFromImage } from "@/lib/vision";
import { getFarmWeather, weatherSnapshot } from "@/lib/weather";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/map");
  revalidatePath("/admin/log");
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

function photoFile(form: FormData) {
  const file = form.get("photo");
  return file instanceof File && file.size > 0 ? file : null;
}

function healthValue(value: string): TreeHealth {
  if (value === "watch" || value === "stressed" || value === "dead") return value;
  return "healthy";
}

function habitValue(value: string): TreeHabit | null {
  if (value === "sapling" || value === "young" || value === "mature") return value;
  return null;
}

function detailsFromForm(domain: ObservationDomain, form: FormData): ObservationDetails {
  const details: ObservationDetails = {};
  if (domain === "harvest" || domain === "plants" || domain === "plant_health") {
    const crop = str(form, "crop");
    if (crop) details.crop = crop;
  }
  if (domain === "harvest") {
    const quantity = num(form, "quantity");
    if (quantity != null) details.quantity = quantity;
    const unit = str(form, "unit");
    if (unit) details.unit = unit;
  }
  if (domain === "rain") {
    const rainMm = num(form, "rainMm");
    if (rainMm != null) details.rainMm = rainMm;
    const pondLevel = str(form, "pondLevel");
    if (pondLevel) details.pondLevel = pondLevel;
  }
  if (domain === "soil") {
    const moisture = str(form, "moisture");
    if (moisture) details.moisture = moisture;
    const action = str(form, "action");
    if (action) details.action = action;
  }
  if (domain === "plants") {
    const stage = str(form, "stage");
    if (stage) details.stage = stage;
  }
  if (domain === "animals") {
    const animalKind = str(form, "animalKind");
    if (animalKind) details.animalKind = animalKind;
    const animalCount = num(form, "animalCount");
    if (animalCount != null) details.animalCount = animalCount;
    const animalCondition = str(form, "animalCondition");
    if (animalCondition) details.animalCondition = animalCondition;
  }
  if (domain === "plant_health") {
    const severity = str(form, "severity");
    if (severity) details.severity = severity;
  }
  if (domain === "stay") {
    const guestCount = num(form, "guestCount");
    if (guestCount != null) details.guestCount = guestCount;
    const stayFrom = str(form, "stayFrom");
    if (stayFrom) details.stayFrom = stayFrom;
    const stayTo = str(form, "stayTo");
    if (stayTo) details.stayTo = stayTo;
  }
  if (domain === "activity") {
    const activityType = str(form, "activityType");
    if (activityType) details.activityType = activityType;
    const attendees = num(form, "attendees");
    if (attendees != null) details.attendees = attendees;
  }
  if (domain === "trees") {
    const action = str(form, "action");
    if (action) details.action = action;
    const crop = str(form, "species");
    if (crop) details.crop = crop;
  }
  return details;
}

export async function createObservationAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) {
    return { ok: false as const, error: "Add DATABASE_URL to save logs on Vercel." };
  }

  const domainRaw = str(formData, "domain");
  if (!isObservationDomain(domainRaw)) {
    return { ok: false as const, error: "Pick a farm domain." };
  }

  const file = photoFile(formData);
  const photoUrl = file ? await uploadPhoto(file) : null;
  const weather = weatherSnapshot(await getFarmWeather());
  const details = detailsFromForm(domainRaw, formData);
  const treeId = str(formData, "treeId") || null;

  await insertObservation({
    domain: domainRaw,
    occurredAt: new Date(),
    note: str(formData, "note") || null,
    photoUrl,
    lat: num(formData, "lat"),
    lng: num(formData, "lng"),
    accuracyM: num(formData, "accuracyM"),
    weather,
    details: Object.keys(details).length ? details : null,
    treeId,
  });

  if (treeId && domainRaw === "plant_health") {
    const severity = details.severity;
    if (severity === "watch" || severity === "stressed" || severity === "dead" || severity === "healthy") {
      await updateTree(treeId, { health: severity });
    }
  }

  revalidateAdmin();
  return { ok: true as const };
}

export async function createTreeAction(formData: FormData) {
  await requireAdmin();
  if (!canPersistFarmData()) {
    return { ok: false as const, error: "Add DATABASE_URL to save trees on Vercel." };
  }

  const lat = num(formData, "lat");
  const lng = num(formData, "lng");
  if (lat == null || lng == null) {
    return { ok: false as const, error: "GPS or a map pin is required." };
  }

  const species = str(formData, "species");
  if (!species) return { ok: false as const, error: "Choose or type a species." };

  const force = str(formData, "force") === "1";
  if (!force) {
    const nearby = await nearbyTrees(lat, lng);
    if (nearby[0]) {
      return {
        ok: false as const,
        duplicate: {
          id: nearby[0].item.id,
          species: nearby[0].item.species,
          meters: Math.round(nearby[0].meters * 10) / 10,
        },
      };
    }
  }

  await upsertSpecies(species, str(formData, "tamil") || null);

  const file = photoFile(formData);
  const photoUrl = file ? await uploadPhoto(file) : null;
  const health = healthValue(str(formData, "health"));
  const habit = habitValue(str(formData, "habit"));
  const plantingYear = num(formData, "plantingYear");
  const note = str(formData, "note") || null;
  const aiRaw = str(formData, "aiSuggestion");
  let aiSuggestion: AiSuggestion | null = null;
  if (aiRaw) {
    try {
      aiSuggestion = JSON.parse(aiRaw) as AiSuggestion;
    } catch {
      aiSuggestion = null;
    }
  }

  const tree = await insertTree({
    lat,
    lng,
    accuracyM: num(formData, "accuracyM"),
    species,
    plantingYear,
    plantedOn: null,
    health,
    habit,
    photoUrl,
    aiSuggestion,
    zone: str(formData, "zone") || null,
    note,
  });

  const weather = weatherSnapshot(await getFarmWeather());
  await insertObservation({
    domain: "trees",
    occurredAt: new Date(),
    note: note ?? `Census: ${species}`,
    photoUrl,
    lat,
    lng,
    accuracyM: num(formData, "accuracyM"),
    weather,
    details: { crop: species, action: "census" },
    treeId: tree.id,
  });

  revalidateAdmin();
  return { ok: true as const, id: tree.id };
}

export async function updateTreeAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false as const, error: "Missing tree." };

  const species = str(formData, "species");
  const patch: Parameters<typeof updateTree>[1] = {
    health: healthValue(str(formData, "health")),
    habit: habitValue(str(formData, "habit")),
    plantingYear: num(formData, "plantingYear"),
    note: str(formData, "note") || null,
    zone: str(formData, "zone") || null,
  };
  if (species) {
    await upsertSpecies(species);
    patch.species = species;
  }
  const lat = num(formData, "lat");
  const lng = num(formData, "lng");
  if (lat != null && lng != null) {
    patch.lat = lat;
    patch.lng = lng;
    patch.accuracyM = num(formData, "accuracyM");
  }
  const file = photoFile(formData);
  if (file) patch.photoUrl = await uploadPhoto(file);

  await updateTree(id, patch);
  revalidateAdmin();
  return { ok: true as const };
}

export async function suggestTreeVisionAction(formData: FormData) {
  await requireAdmin();
  const file = photoFile(formData);
  if (!file) return { ok: false as const, error: "Take a photo first." };
  const suggestion = await suggestFromImage(file);
  if (!suggestion) {
    return { ok: false as const, error: "Vision is off or could not read this photo." };
  }
  return { ok: true as const, suggestion };
}

export async function saveBoundaryAction(points: { lat: number; lng: number }[]) {
  await requireAdmin();
  if (points.length < 3) return { ok: false as const, error: "Walk at least three points." };
  const ring = [...points];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) ring.push(first);
  const polygon: GeoPolygon = {
    type: "Polygon",
    coordinates: [ring.map((point) => [point.lng, point.lat])],
  };
  await saveFarmBoundary(polygon);
  revalidateAdmin();
  return { ok: true as const };
}

export async function getTreeDetailAction(id: string) {
  await requireAdmin();
  const tree = await getTree(id);
  if (!tree) return null;
  const notes = await listObservations({ treeId: id, limit: 8 });
  return {
    tree: {
      ...tree,
      plantedOn: tree.plantedOn ? new Date(tree.plantedOn).toISOString() : null,
      createdAt: tree.createdAt.toISOString(),
      updatedAt: tree.updatedAt.toISOString(),
    },
    notes: notes.map((row) => ({
      id: row.id,
      domain: row.domain,
      note: row.note,
      occurredAt: row.occurredAt.toISOString(),
      photoUrl: row.photoUrl,
    })),
  };
}
