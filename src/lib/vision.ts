import { aiCauses, type AiCause, type AiSuggestion, type ObservationDomain, type TreeHabit, type TreeHealth } from "@/db/schema";
import { domainCatalogBySlug } from "@/lib/packs/domains";
import { fileToBase64 } from "@/lib/photos";
import { getFarmProfile } from "@/lib/profile";

const HABITS: TreeHabit[] = ["sapling", "young", "mature"];
const HEALTH: TreeHealth[] = ["healthy", "watch", "stressed", "dead"];

export type VisionPack = "tree" | "plant_health" | "compost" | "cattle";

export function visionPackForDomain(domain: ObservationDomain): VisionPack {
  return domainCatalogBySlug[domain]?.visionPack ?? "tree";
}

async function farmLine() {
  const profile = await getFarmProfile();
  const acres = profile.acres ? `${profile.acres}-acre ` : "";
  const place = profile.location.village || profile.location.address || "this farm";
  return `${acres}${profile.name} in ${place}`;
}

async function packPrompt(pack: VisionPack) {
  const farm = await farmLine();
  if (pack === "plant_health") {
    return `You help ${farm} read plant health from a phone photo.
Identify crop, pot herb, or tree if possible. Name the likely pest, disease, nutrient gap, or water stress.
Return ONLY JSON with keys: species, tamil, habit, health, confidence, rationale, issue, cause, culturalControl.
cause must be one of: pest, disease, nutrient, water, unknown.
culturalControl is one safe next step for a field bed or a home pot: hand pick, neem, drainage, compost, shade, or ease watering. Do not name a pesticide brand.
habit one of: sapling, young, mature (or null).
health one of: healthy, watch, stressed, dead.
confidence 0-1.`;
  }
  if (pack === "compost") {
    return `You read compost or mulch heaps on ${farm}.
Judge maturity (fresh / turning / ready) and moisture. Suggest the next physical action.
Return ONLY JSON with keys: species, tamil, habit, health, confidence, rationale, compostMaturity.
species can be "compost". health: healthy if ready, watch if turning, stressed if anaerobic/dry.`;
  }
  if (pack === "cattle") {
    return `You read farm animals at ${farm} from a phone photo.
Return ONLY JSON with keys: species, tamil, habit, health, confidence, rationale, cattleCondition.
species is the animal kind. health maps condition: healthy, watch, stressed.`;
  }
  return `You help census trees and saplings on ${farm}.
Identify the most likely species (common English name), Tamil name if you know it, growth habit, and health.
Return ONLY JSON with keys: species, tamil, habit, health, confidence, rationale.
habit must be one of: sapling, young, mature.
health must be one of: healthy, watch, stressed, dead.
confidence is 0-1.
If it is not a plant, species should be "unknown" and confidence low.`;
}

export async function geminiGenerateJson(prompt: string, file?: File) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [{ text: prompt }];
  if (file) {
    parts.push({
      inline_data: { mime_type: file.type || "image/jpeg", data: await fileToBase64(file) },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return body.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

export async function geminiGenerateText(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return body.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

export async function suggestFromImage(
  file: File,
  pack: VisionPack = "tree",
): Promise<AiSuggestion | null> {
  const text = await geminiGenerateJson(await packPrompt(pack), file);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as Partial<AiSuggestion>;
    const habit = HABITS.includes(parsed.habit as TreeHabit) ? (parsed.habit as TreeHabit) : null;
    const health = HEALTH.includes(parsed.health as TreeHealth)
      ? (parsed.health as TreeHealth)
      : null;
    return {
      species: String(parsed.species || "unknown"),
      tamil: parsed.tamil ? String(parsed.tamil) : null,
      habit,
      health,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      rationale: String(parsed.rationale || ""),
      issue: parsed.issue ? String(parsed.issue) : null,
      cause: aiCauses.includes(parsed.cause as AiCause) ? (parsed.cause as AiCause) : null,
      culturalControl: parsed.culturalControl ? String(parsed.culturalControl) : null,
      compostMaturity: parsed.compostMaturity ? String(parsed.compostMaturity) : null,
      cattleCondition: parsed.cattleCondition ? String(parsed.cattleCondition) : null,
    };
  } catch {
    return null;
  }
}
