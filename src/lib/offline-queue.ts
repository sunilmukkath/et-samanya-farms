const KEY = "samanya-offline-logs";

export type QueuedLog = {
  id: string;
  createdAt: string;
  fields: Record<string, string>;
  photo?: { name: string; type: string; dataUrl: string };
};

function readQueue(): QueuedLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedLog[];
  } catch {
    return [];
  }
}

function writeQueue(rows: QueuedLog[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function queuedLogCount() {
  return readQueue().length;
}

export async function enqueueObservation(form: FormData) {
  const fields: Record<string, string> = {};
  let photo: QueuedLog["photo"];
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      if (!value.size) continue;
      photo = {
        name: value.name || "photo.jpg",
        type: value.type || "image/jpeg",
        dataUrl: await fileToDataUrl(value),
      };
      continue;
    }
    fields[key] = String(value);
  }
  const rows = readQueue();
  rows.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), fields, photo });
  writeQueue(rows);
}

export async function flushQueuedObservations(
  send: (form: FormData) => Promise<{ ok: boolean; error?: string }>,
) {
  const rows = readQueue();
  if (!rows.length || (typeof navigator !== "undefined" && !navigator.onLine)) return rows.length;
  const remaining: QueuedLog[] = [];
  for (const row of rows) {
    const form = new FormData();
    for (const [key, value] of Object.entries(row.fields)) form.set(key, value);
    if (row.photo) {
      const file = dataUrlToFile(row.photo.dataUrl, row.photo.name, row.photo.type);
      form.set("photo", file);
    }
    try {
      const result = await send(form);
      if (!result.ok) remaining.push(row);
    } catch {
      remaining.push(row);
    }
  }
  writeQueue(remaining);
  return remaining.length;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, name: string, type: string) {
  const [, payload = ""] = dataUrl.split(",");
  const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  return new File([bytes], name, { type });
}
