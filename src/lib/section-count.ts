import { geminiGenerateJson } from "@/lib/vision";
import { getFarmProfile } from "@/lib/profile";

export type SectionCountGuess = {
  trees: number;
  plants: number;
  species: string | null;
  note: string;
  confidence: number;
};

export async function countSectionFromImage(file: File): Promise<SectionCountGuess | null> {
  const profile = await getFarmProfile();
  const place = profile.location.village || profile.name;
  const text = await geminiGenerateJson(
    `You count trees and plants in one phone photo of a farm section at ${place}.
Count only what is visible in this frame. Do not guess the rest of the farm.
trees = woody stems (mango, coconut, palmyra, teak, jackfruit, and similar).
plants = horticulture beds, greens, annuals, banana mats not already counted as trees.
If a stem is cut by the frame, count it. If you cannot see a stem, do not count it.
Return ONLY JSON with keys: trees, plants, species, note, confidence.
trees and plants are integers. species is the main thing you see or null.
note is one short sentence. confidence is 0-1.`,
    file,
  );
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Partial<SectionCountGuess>;
    const trees = Math.max(0, Math.round(Number(parsed.trees) || 0));
    const plants = Math.max(0, Math.round(Number(parsed.plants) || 0));
    return {
      trees,
      plants,
      species: parsed.species ? String(parsed.species) : null,
      note: String(parsed.note || ""),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    };
  } catch {
    return null;
  }
}
