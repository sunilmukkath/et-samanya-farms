import type { CaptureField } from "@/lib/packs/types";
import { geminiGenerateJson } from "@/lib/vision";

export type VoiceFill = {
  note: string;
  fields: Record<string, string>;
};

function pickOption(
  field: { options: string[]; values?: string[] },
  text: string,
) {
  const options = field.options;
  const values = field.values ?? options;
  const lower = text.toLowerCase();
  for (let i = 0; i < Math.max(options.length, values.length); i++) {
    const option = options[i] ?? "";
    const value = values[i] ?? option;
    if (option.toLowerCase() === lower || value.toLowerCase() === lower) return value;
  }
  return null;
}

export async function parseSpokenLog(
  transcript: string,
  fields: CaptureField[],
  resolved: { name: string; label: string; options: string[]; values?: string[] }[],
): Promise<VoiceFill | null> {
  const spoken = transcript.trim().slice(0, 800);
  if (!spoken) return null;

  const catalog = resolved.map((field) => ({
    name: field.name,
    label: field.label,
    options: field.options,
    values: field.values,
  }));

  const raw = await geminiGenerateJson(
    `A farmer dictated a field note. Fill the form only from what they said.
Transcript: ${spoken}
Fields JSON: ${JSON.stringify(catalog)}
Return ONLY JSON: {"note":"...","fields":{"fieldName":"value"}}
Rules:
- note is a short cleaned version of the transcript (keep Tamil if spoken).
- fields keys must be field names from the catalog.
- For chips/select, value must be one of options or values.
- Numbers only if they said a number. Do not invent millimetres, counts, or dates.
- Omit fields they did not mention.
Domain field names also include: ${fields.map((field) => field.name).join(", ")}`,
  );
  if (!raw) return { note: spoken, fields: {} };

  try {
    const parsed = JSON.parse(raw) as { note?: unknown; fields?: unknown };
    const next: Record<string, string> = {};
    const allowed = new Set(resolved.map((field) => field.name));
    if (parsed.fields && typeof parsed.fields === "object") {
      for (const [key, value] of Object.entries(parsed.fields as Record<string, unknown>)) {
        if (!allowed.has(key) || value == null) continue;
        const text = String(value === true ? "On" : value === false ? "Off" : value).trim();
        if (!text) continue;
        const field = resolved.find((item) => item.name === key);
        if (field?.options.length) {
          const picked = pickOption(field, text);
          if (picked != null) next[key] = picked;
        } else {
          next[key] = text.slice(0, 120);
        }
      }
    }
    return {
      note: typeof parsed.note === "string" && parsed.note.trim() ? parsed.note.trim() : spoken,
      fields: next,
    };
  } catch {
    return { note: spoken, fields: {} };
  }
}
