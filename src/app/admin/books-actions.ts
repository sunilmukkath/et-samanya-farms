"use server";

import { revalidatePath } from "next/cache";
import {
  canPersistFarmData,
  deleteVoucher,
  insertBookVoucher,
  saveBookSettings,
} from "@/db/queries";
import { requireOperator } from "@/lib/admin";
import {
  defaultCategory,
  isGstKind,
  isPaymentMode,
  isVoucherKind,
  newSecretToken,
  parseIndianBankSms,
  parseIstDate,
  rupeesToPaise,
  walletForMode,
  type GstKind,
  type VoucherKind,
} from "@/lib/accounts";
import { uploadPhoto } from "@/lib/photos";
import { suggestFromReceipt } from "@/lib/receipt-vision";

function revalidateBooks() {
  revalidatePath("/admin");
  revalidatePath("/admin/books");
  revalidatePath("/admin/books/new");
  revalidatePath("/admin/books/reports");
  revalidatePath("/admin/books/ledgers");
}

function str(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function persistError() {
  return { ok: false as const, error: "Add DATABASE_URL to save books on Vercel." };
}

function photoFile(form: FormData) {
  const file = form.get("photo");
  return file instanceof File && file.size > 0 ? file : null;
}

export async function createVoucherAction(formData: FormData) {
  await requireOperator();
  if (!canPersistFarmData()) return persistError();

  const kindRaw = str(formData, "kind") || "expense";
  if (!isVoucherKind(kindRaw) || kindRaw === "journal") {
    return { ok: false as const, error: "Pick expense, income, or transfer." };
  }
  const kind = kindRaw as VoucherKind;
  const amountPaise = rupeesToPaise(str(formData, "amount"));
  if (!amountPaise || amountPaise <= 0) return { ok: false as const, error: "Enter an amount in rupees." };

  const paymentRaw = str(formData, "paymentMode");
  const paymentMode = isPaymentMode(paymentRaw) ? paymentRaw : "cash";
  const gstKind: GstKind = isGstKind(str(formData, "gstKind")) ? (str(formData, "gstKind") as GstKind) : "none";
  const gstRate = Number(str(formData, "gstRate") || "0");
  const file = photoFile(formData);
  const photoUrl = file ? await uploadPhoto(file) : str(formData, "photoUrl") || null;
  const smsRaw = str(formData, "smsRaw") || null;

  try {
    const voucher = await insertBookVoucher({
      kind,
      occurredAt: parseIstDate(str(formData, "occurredOn")),
      partyName: str(formData, "partyName") || null,
      narration: str(formData, "narration") || null,
      amountPaise,
      gstRate: [0, 5, 12, 18, 28].includes(gstRate) ? gstRate : 0,
      gstKind,
      gstInclusive: str(formData, "inclusive") !== "0",
      paymentMode,
      categoryAccountId: str(formData, "categoryAccountId") || defaultCategory(kind),
      walletAccountId: str(formData, "walletAccountId") || walletForMode(paymentMode, kind),
      transferToId: str(formData, "transferToId") || null,
      photoUrl,
      smsRaw,
      smsHash: str(formData, "smsHash") || null,
      source: smsRaw ? "sms" : file || photoUrl ? "photo" : "manual",
      gstin: str(formData, "gstin") || null,
      invoiceNo: str(formData, "invoiceNo") || null,
      hsn: str(formData, "hsn") || null,
    });
    revalidateBooks();
    return { ok: true as const, id: voucher.id, number: voucher.number };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not post the voucher." };
  }
}

export async function parseSmsAction(formData: FormData) {
  await requireOperator();
  const text = str(formData, "sms");
  const parsed = parseIndianBankSms(text);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };
  return {
    ok: true as const,
    parsed: {
      ...parsed,
      occurredAt: parsed.occurredAt ? parsed.occurredAt.toISOString() : null,
      amount: (parsed.amountPaise / 100).toFixed(2),
    },
  };
}

export async function readBillAction(formData: FormData) {
  await requireOperator();
  const file = photoFile(formData);
  if (!file) return { ok: false as const, error: "Photograph the bill first." };
  const suggestion = await suggestFromReceipt(file);
  const photoUrl = await uploadPhoto(file);
  if (!suggestion) {
    return {
      ok: true as const,
      suggestion: {
        kind: "expense" as const,
        vendor: null as string | null,
        amount: "",
        date: null as string | null,
        gstin: null as string | null,
        invoiceNo: null as string | null,
        gstKind: "none" as const,
        gstRate: 0,
        paymentMode: "cash" as const,
        categoryAccountId: "exp_misc",
        narration: "Bill photo",
        confidence: 0,
        photoUrl,
      },
    };
  }
  return {
    ok: true as const,
    suggestion: {
      ...suggestion,
      amount: suggestion.amountPaise != null ? (suggestion.amountPaise / 100).toFixed(2) : "",
      photoUrl,
    },
  };
}

export async function rotateSmsTokenAction(formData: FormData) {
  void formData;
  await requireOperator();
  if (!canPersistFarmData()) return;
  const token = newSecretToken();
  await saveBookSettings({ smsToken: token });
  revalidateBooks();
}

export async function saveGstinAction(formData: FormData) {
  await requireOperator();
  if (!canPersistFarmData()) return;
  await saveBookSettings({ gstin: str(formData, "gstin") || null, pan: str(formData, "pan") || null });
  revalidateBooks();
}

export async function removeVoucherAction(formData: FormData) {
  await requireOperator();
  if (!canPersistFarmData()) return persistError();
  const id = str(formData, "id");
  if (!id) return { ok: false as const, error: "Missing voucher." };
  await deleteVoucher(id);
  revalidateBooks();
  return { ok: true as const };
}
