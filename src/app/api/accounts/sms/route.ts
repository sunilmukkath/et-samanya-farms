import { canPersistFarmData, getBookSettings, getVoucherBySmsHash, insertBookVoucher } from "@/db/queries";
import { parseIndianBankSms } from "@/lib/accounts";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function bearerToken(header: string | null) {
  if (!header) return null;
  const [type, value] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

async function authorized(request: NextRequest) {
  const token = bearerToken(request.headers.get("authorization")) ?? request.nextUrl.searchParams.get("token");
  if (!token) return false;
  if (process.env.BOOKS_SMS_TOKEN && token === process.env.BOOKS_SMS_TOKEN) return true;
  const settings = await getBookSettings();
  return Boolean(settings?.smsToken && settings.smsToken === token);
}

export async function POST(request: NextRequest) {
  if (!canPersistFarmData()) return json({ error: "Farm store is not ready." }, 503);
  if (!(await authorized(request))) return json({ error: "Unknown SMS token." }, 401);

  let body: unknown = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = { text: raw };
    }
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const text = String(payload.text ?? payload.sms ?? payload.message ?? "").trim();
  if (!text) return json({ error: "Send { text: \"…\" } from the SMS." }, 400);

  const parsed = parseIndianBankSms(text);
  if ("error" in parsed) return json({ error: parsed.error }, 422);

  const existing = await getVoucherBySmsHash(parsed.fingerprint);
  if (existing) {
    return json({ ok: true, duplicate: true, voucherId: existing.id, number: existing.number });
  }

  const voucher = await insertBookVoucher({
    kind: parsed.kind,
    occurredAt: parsed.occurredAt ?? new Date(),
    partyName: parsed.party,
    narration: parsed.narration,
    amountPaise: parsed.amountPaise,
    gstRate: 0,
    gstKind: parsed.kind === "income" ? "exempt" : "none",
    gstInclusive: true,
    paymentMode: parsed.paymentMode,
    categoryAccountId: parsed.categoryAccountId,
    walletAccountId: parsed.walletAccountId,
    smsRaw: text,
    smsHash: parsed.fingerprint,
    source: "sms",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/books");
  return json({ ok: true, voucherId: voucher.id, number: voucher.number, kind: voucher.kind });
}
