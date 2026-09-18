import { isDatabaseConfigured } from "@/db/index";
import { isBlobConfigured, isVisionConfigured } from "@/lib/farm";

export type KernelCheck = {
  id: "database" | "blob" | "vision";
  ok: boolean;
  label: string;
  hint: string;
};

export function kernelChecks(): KernelCheck[] {
  const onVercel = process.env.VERCEL === "1";
  const database = isDatabaseConfigured();
  const blob = isBlobConfigured();
  const vision = isVisionConfigured();

  return [
    {
      id: "database",
      ok: database,
      label: "Postgres",
      hint: database
        ? "Railway DATABASE_URL is connected. Logs stay on the server."
        : onVercel
          ? "Add Railway DATABASE_URL on Vercel so the census and notes persist."
          : "Local JSON log is on. Add Railway DATABASE_URL before going live.",
    },
    {
      id: "blob",
      ok: blob || !onVercel,
      label: "Photos",
      hint: blob
        ? "Vercel Blob will keep field photos."
        : onVercel
          ? "Add BLOB_READ_WRITE_TOKEN so camera photos survive deploys."
          : "Photos save under /public/uploads on this machine.",
    },
    {
      id: "vision",
      ok: vision,
      label: "Gemini vision",
      hint: vision
        ? "Photo suggest is on. You still confirm species and health."
        : "Optional: add GEMINI_API_KEY to suggest species, pests, and compost from photos.",
    },
  ];
}

export function kernelReady() {
  return kernelChecks().every((check) => check.ok);
}
