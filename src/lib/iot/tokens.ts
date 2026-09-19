import { createHash, randomBytes } from "node:crypto";

export function hashDeviceToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function mintDeviceToken() {
  return `farm_${randomBytes(24).toString("hex")}`;
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  try {
    return createHash("sha256").update(a).digest("hex") === createHash("sha256").update(b).digest("hex")
      ? a === b
      : false;
  } catch {
    return a === b;
  }
}
