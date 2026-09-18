import type { AiSuggestion, TreeHabit, TreeHealth } from "@/db/schema";
import { fileToBase64 } from "@/lib/photos";

const HABITS: TreeHabit[] = ["sapling", "young", "mature"];
const HEALTH: TreeHealth[] = ["healthy", "watch", "stressed", "dead"];

export async function suggestFromImage(file: File): Promise<AiSuggestion | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const mime = file.type || "image/jpeg";
  const data = await fileToBase64(file);
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You help census trees and saplings on a 5-acre agroforestry farm in Tamil Nadu, India.
Identify the most likely species (common English name), Tamil name if you know it, growth habit, and health.
Return ONLY JSON with keys: species, tamil, habit, health, confidence, rationale.
habit must be one of: sapling, young, mature.
health must be one of: healthy, watch, stressed, dead.
confidence is 0-1.
If it is not a plant, species should be "unknown" and confidence low.`,
              },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );

  if (!res.ok) return null;
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
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
    };
  } catch {
    return null;
  }
}
