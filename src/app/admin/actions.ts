"use server";

import { revalidatePath } from "next/cache";
import {
  acknowledgeAlert,
  canPersistFarmData,
  completeTask,
  getDevice,
  getTree,
  insertAnimal,
  insertDevice,
  insertLedger,
  insertObservation,
  insertPlantStand,
  insertPlot,
  insertTree,
  listAnimals,
  listObservations,
  listPlantStands,
  nearbyTrees,
  saveFarmBoundary,
  saveFarmProfileRecord,
  updatePlot,
  updateTree,
  upsertSpecies,
} from "@/db/queries";
import type {
  AiSuggestion,
  DeviceKind,
  DeviceProtocol,
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
import { askFarm } from "@/lib/ask";
import { generateFarmBrief } from "@/lib/brief";
import { detailsFromFields, resolveFieldOptions } from "@/lib/capture";
import { applyPhi } from "@/lib/phi";
import { parseSpokenLog } from "@/lib/voice-log";
import { isObservationDomain, plotKindOptions } from "@/lib/farm";
import { hashDeviceToken, mintDeviceToken } from "@/lib/iot/tokens";
import { actuationAllowed, recordActuation } from "@/lib/iot/ota";
import { isPackId } from "@/lib/packs/resolve";
import type { PackId } from "@/lib/packs/types";
import { biomeById } from "@/lib/profiles/biomes";
import { clearFarmProfileCache, getFarmProfile, getRuntimeFarm } from "@/lib/profile";
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
  revalidatePath("/admin/nodes");
  revalidatePath("/admin/stands");
  revalidatePath("/admin/setup");
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

function detailsFromForm(_domain: ObservationDomain, form: FormData, fields: import("@/lib/packs/types").CaptureField[]): ObservationDetails {
  const details = detailsFromFields(fields, form);
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
  const runtime = await getRuntimeFarm();
  const details = detailsFromForm(domainRaw, formData, runtime.domainBySlug[domainRaw]?.fields ?? []);
  if (domainRaw === "plant_health") applyPhi(details);
  const treeId = str(formData, "treeId") || null;
  const plotId = str(formData, "plotId") || null;
  const animalId = str(formData, "animalId") || null;
  const plantStandId = str(formData, "plantStandId") || details.plantStandId || null;
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
    plantStandId,
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

export async function askFarmAction(question: string) {
  await requireAdmin();
  return askFarm(question);
}

export async function suggestVoiceLogAction(formData: FormData) {
  await requireAdmin();
  const transcript = str(formData, "transcript");
  const domainRaw = str(formData, "domain");
  if (!transcript || !isObservationDomain(domainRaw)) {
    return { ok: false as const, error: "Speak a note first." };
  }
  const runtime = await getRuntimeFarm();
  const fields = runtime.domainBySlug[domainRaw]?.fields ?? [];
  const [animals, plantStands] = await Promise.all([listAnimals(), listPlantStands()]);
  const resolved = fields.map((field) => ({
    name: field.name,
    label: field.label,
    ...resolveFieldOptions(field, runtime, { animals, plantStands }),
  }));
  const fill = await parseSpokenLog(transcript, fields, resolved);
  if (!fill) return { ok: false as const, error: "Could not hear that." };
  return { ok: true as const, fill };
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
  const runtime = await getRuntimeFarm();
  await insertAnimal({
    name,
    species: str(formData, "species") || runtime.defaultAnimalKind,
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

export async function createPlantStandAction(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  const crop = str(formData, "crop");
  if (!name || !crop) return;
  const stageRaw = str(formData, "stage");
  const stage =
    stageRaw === "seedling" || stageRaw === "flowering" || stageRaw === "harvest" || stageRaw === "fallow"
      ? stageRaw
      : "growing";
  await insertPlantStand({
    name,
    crop,
    stage,
    plotId: str(formData, "plotId") || null,
    plantedOn: str(formData, "plantedOn") ? new Date(str(formData, "plantedOn")) : null,
    note: str(formData, "note") || null,
  });
  revalidateAdmin();
}

export async function createDeviceAction(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return { ok: false as const, error: "Name the node." };
  const kindRaw = str(formData, "kind");
  const kind: DeviceKind =
    kindRaw === "pond" ||
    kindRaw === "weather" ||
    kindRaw === "pump" ||
    kindRaw === "valve" ||
    kindRaw === "camera" ||
    kindRaw === "counter" ||
    kindRaw === "tank"
      ? kindRaw
      : "soil";
  const protocolRaw = str(formData, "protocol");
  const protocol: DeviceProtocol =
    protocolRaw === "mqtt" || protocolRaw === "lora" ? protocolRaw : "http";
  const token = mintDeviceToken();
  const device = await insertDevice({
    name,
    kind,
    protocol,
    tokenHash: hashDeviceToken(token),
    plotId: str(formData, "plotId") || null,
    plantStandId: str(formData, "plantStandId") || null,
    treeId: null,
    animalId: null,
    lat: num(formData, "lat"),
    lng: num(formData, "lng"),
    firmware: str(formData, "firmware") || null,
    lastSeenAt: null,
    batteryV: null,
    rssi: null,
    config: null,
    status: "offline",
  });
  revalidateAdmin();
  return { ok: true as const, id: device.id, token };
}

export async function commandDeviceAction(formData: FormData) {
  await requireOperator();
  const id = str(formData, "id");
  const command = str(formData, "command") || "off";
  const device = await getDevice(id);
  if (!device) return;
  if (device.kind !== "pump" && device.kind !== "valve") return;
  const allowed = actuationAllowed(command, device.lastSeenAt);
  if (!allowed.ok) return;
  await recordActuation(id, command);
  await insertObservation({
    domain: "kit",
    occurredAt: new Date(),
    note: `Command ${command} → ${device.name}`,
    photoUrl: null,
    lat: device.lat,
    lng: device.lng,
    accuracyM: null,
    weather: weatherSnapshot(await getFarmWeather()),
    details: { kitItem: device.name, kitStatus: command === "on" ? "On" : "Off", deviceId: device.id, pumpOn: command === "on" },
    treeId: device.treeId,
    plotId: device.plotId,
    animalId: null,
    plantStandId: device.plantStandId,
    source: "sensor",
    createdBy: "operator",
  });
  revalidateAdmin();
}

export async function acknowledgeAlertAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await acknowledgeAlert(id);
  revalidateAdmin();
}

export async function saveFarmSetupAction(formData: FormData) {
  await requireOperator();
  const current = await getFarmProfile();
  const packs = formData.getAll("packs").map(String).filter(isPackId) as PackId[];
  const biome = biomeById(str(formData, "biomeId") || current.biomeId);
  const lat = num(formData, "lat") ?? current.location.lat;
  const lng = num(formData, "lng") ?? current.location.lng;
  const applyBiome = str(formData, "applyBiome") === "1";
  const next = {
    ...current,
    name: str(formData, "name") || current.name,
    shortName: str(formData, "shortName") || current.shortName,
    timezone: str(formData, "timezone") || current.timezone,
    currency: str(formData, "currency") || current.currency,
    units: str(formData, "units") === "imperial" ? "imperial" : "metric",
    languages: str(formData, "languages")
      ? str(formData, "languages").split(",").map((part) => part.trim()).filter(Boolean)
      : current.languages,
    acres: num(formData, "acres") ?? current.acres,
    treeCensusTarget: num(formData, "treeCensusTarget"),
    animalCensusTarget: num(formData, "animalCensusTarget"),
    bedCensusTarget: num(formData, "bedCensusTarget"),
    enabledPacks: packs.length ? packs : current.enabledPacks,
    publicSite: str(formData, "publicSite") === "1",
    biomeId: biome.id,
    location: {
      ...current.location,
      lat,
      lng,
      village: str(formData, "village") || current.location.village,
      address: str(formData, "address") || current.location.address,
      timezone: str(formData, "timezone") || current.timezone,
    },
    onboardedAt: new Date().toISOString(),
  };
  if (applyBiome) {
    next.harvestCrops = biome.harvestCrops;
    next.seedSpecies = biome.seedSpecies;
    next.seedPlots = biome.seedPlots;
    next.zoneLabels = biome.zoneLabels;
    next.kitItems = biome.kitItems;
    next.defaultAnimalKind = biome.defaultAnimalKind;
    next.rules = biome.rules;
  }
  await saveFarmProfileRecord(next);
  clearFarmProfileCache();
  revalidateAdmin();
}
