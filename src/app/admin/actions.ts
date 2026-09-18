"use server";

import { revalidatePath } from "next/cache";
import {
  canPersistFarmData,
  completeTask,
  getTree,
  insertAnimal,
  insertLedger,
  insertObservation,
  insertPlot,
  insertTree,
  listObservations,
  nearbyTrees,
  saveFarmBoundary,
  updatePlot,
  updateTree,
  upsertSpecies,
} from "@/db/queries";
import type {
  AiSuggestion,
  GeoPolygon,
  LedgerKind,
  ObservationDetails,
  ObservationDomain,
  ObservationSource,
  PlotKind,
  TreeHabit,
  TreeHealth,
} from "@/db/schema";
import { farmRole, requireAdmin, requireOperator } from "@/lib/admin";
import { generateFarmBrief } from "@/lib/brief";
import { isObservationDomain, plotKindOptions } from "@/lib/farm";
import { uploadPhoto } from "@/lib/photos";
import { deriveFarmTasks } from "@/lib/tasks";
import { suggestFromImage, visionPackForDomain, type VisionPack } from "@/lib/vision";
import { getFarmWeather, weatherSnapshot } from "@/lib/weather";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/map");
  revalidatePath("/admin/log");
  revalidatePath("/admin/brief");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/search");
  revalidatePath("/admin/season");
  revalidatePath("/admin/ledger");
  revalidatePath("/admin/plots");
  revalidatePath("/admin/animals");
  revalidatePath("/harvest");
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

function sourceValue(value: string, role: "operator" | "staff" | null): ObservationSource {
  if (value === "sensor" || value === "drone" || value === "voice") return value;
  if (role === "staff") return "staff";
  return "operator";
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
    const destination = str(form, "destination");
    if (destination) details.destination = destination;
  }
  if (domain === "rain") {
    const rainMm = num(form, "rainMm");
    if (rainMm != null) details.rainMm = rainMm;
    const pondLevel = str(form, "pondLevel");
    if (pondLevel) details.pondLevel = pondLevel;
    const irrigationMinutes = num(form, "irrigationMinutes");
    if (irrigationMinutes != null) details.irrigationMinutes = irrigationMinutes;
    const pump = str(form, "pumpOn");
    if (pump === "On") details.pumpOn = true;
    if (pump === "Off") details.pumpOn = false;
    const canalNote = str(form, "canalNote");
    if (canalNote) details.canalNote = canalNote;
    const tankLevel = str(form, "tankLevel");
    if (tankLevel) details.tankLevel = tankLevel;
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
    const feedKg = num(form, "feedKg");
    if (feedKg != null) details.feedKg = feedKg;
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
    const hours = num(form, "hours");
    if (hours != null) details.hours = hours;
    const who = str(form, "who");
    if (who) details.who = who;
  }
  if (domain === "trees") {
    const action = str(form, "action");
    if (action) details.action = action;
    const crop = str(form, "species");
    if (crop) details.crop = crop;
  }
  if (domain === "kit") {
    const kitItem = str(form, "kitItem");
    if (kitItem) details.kitItem = kitItem;
    const kitStatus = str(form, "kitStatus");
    if (kitStatus) details.kitStatus = kitStatus;
    const hours = num(form, "hours");
    if (hours != null) details.hours = hours;
    const irrigationMinutes = num(form, "irrigationMinutes");
    if (irrigationMinutes != null) details.irrigationMinutes = irrigationMinutes;
  }
  const sensorId = str(form, "sensorId");
  if (sensorId) details.sensorId = sensorId;
  const voiceLang = str(form, "voiceLang");
  if (voiceLang) details.voiceLang = voiceLang;
  const aiRaw = str(form, "aiSuggestion");
  if (aiRaw) {
    try {
      details.aiSuggestion = JSON.parse(aiRaw) as AiSuggestion;
    } catch {
      /* ignore */
    }
  }
  return details;
}

export async function createObservationAction(formData: FormData) {
  const session = await requireAdmin();
  if (!canPersistFarmData()) {
    return { ok: false as const, error: "Add Railway DATABASE_URL to save logs on Vercel." };
  }

  const domainRaw = str(formData, "domain");
  if (!isObservationDomain(domainRaw)) {
    return { ok: false as const, error: "Pick a farm domain." };
  }

  let photoUrl: string | null = null;
  try {
    const file = photoFile(formData);
    photoUrl = file ? await uploadPhoto(file) : null;
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Photo upload failed." };
  }

  const weather = weatherSnapshot(await getFarmWeather());
  const details = detailsFromForm(domainRaw, formData);
  const treeId = str(formData, "treeId") || null;
  const plotId = str(formData, "plotId") || null;
  const animalId = str(formData, "animalId") || null;
  const role = farmRole(session.user?.email);
  const source = sourceValue(str(formData, "source"), role);

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
    plotId,
    animalId,
    source,
    createdBy: session.user?.email ?? null,
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
  const session = await requireAdmin();
  if (!canPersistFarmData()) {
    return { ok: false as const, error: "Add Railway DATABASE_URL to save trees on Vercel." };
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

  let photoUrl: string | null = null;
  try {
    const file = photoFile(formData);
    photoUrl = file ? await uploadPhoto(file) : null;
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Photo upload failed." };
  }
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
    plotId: str(formData, "plotId") || null,
    animalId: null,
    source: farmRole(session.user?.email) === "staff" ? "staff" : "operator",
    createdBy: session.user?.email ?? null,
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
  const packRaw = str(formData, "pack") as VisionPack | "";
  const domainRaw = str(formData, "domain");
  const pack: VisionPack =
    packRaw === "tree" || packRaw === "plant_health" || packRaw === "compost" || packRaw === "cattle"
      ? packRaw
      : isObservationDomain(domainRaw)
        ? visionPackForDomain(domainRaw)
        : "tree";
  const suggestion = await suggestFromImage(file, pack);
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

export async function refreshBriefAction() {
  await requireAdmin();
  if (!canPersistFarmData()) return;
  await generateFarmBrief("weekly");
  revalidateAdmin();
}

export async function deriveTasksAction() {
  await requireAdmin();
  if (!canPersistFarmData()) return;
  await deriveFarmTasks();
  revalidateAdmin();
}

export async function completeTaskAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await completeTask(id, null);
  revalidateAdmin();
}

export async function createPlotAction(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return;
  const kindRaw = str(formData, "kind");
  const kind: PlotKind = plotKindOptions.some((opt) => opt.value === kindRaw)
    ? (kindRaw as PlotKind)
    : "other";
  await insertPlot({ name, kind, polygon: null, note: str(formData, "note") || null });
  revalidateAdmin();
}

export async function savePlotPolygonAction(id: string, points: { lat: number; lng: number }[]) {
  await requireAdmin();
  if (!id || points.length < 3) return { ok: false as const, error: "Walk at least three points." };
  const ring = [...points];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) ring.push(first);
  await updatePlot(id, {
    polygon: { type: "Polygon", coordinates: [ring.map((point) => [point.lng, point.lat])] },
  });
  revalidateAdmin();
  return { ok: true as const };
}

export async function createAnimalAction(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return;
  await insertAnimal({
    name,
    species: str(formData, "species") || "Cattle",
    sex: str(formData, "sex") || null,
    tag: str(formData, "tag") || null,
    bornOn: null,
    status: str(formData, "status") || "active",
    note: str(formData, "note") || null,
  });
  revalidateAdmin();
}

export async function createLedgerAction(formData: FormData) {
  await requireOperator();
  const amount = num(formData, "amount");
  if (amount == null) return;
  const kindRaw = str(formData, "kind");
  const kind: LedgerKind = kindRaw === "income" ? "income" : "expense";
  await insertLedger({
    occurredAt: new Date(),
    kind,
    category: str(formData, "category") || "Other",
    amount,
    note: str(formData, "note") || null,
    observationId: null,
  });
  revalidateAdmin();
}
