import type { GstKind, PaymentMode, VoucherKind } from "@/lib/accounts";
import { fileToBase64 } from "@/lib/photos";
import { isGstKind, isPaymentMode, isVoucherKind, rupeesToPaise, suggestCategoryId } from "@/lib/accounts";

export type ReceiptSuggestion = {
  kind: VoucherKind;
  vendor: string | null;
  amountPaise: number | null;
  date: string | null;
  gstin: string | null;
  invoiceNo: string | null;
  hsn: string | null;
  gstRate: number;
  gstKind: GstKind;
  inclusive: boolean;
  cgstPaise: number | null;
  sgstPaise: number | null;
  igstPaise: number | null;
  paymentMode: PaymentMode;
  categoryAccountId: string;
  narration: string;
  confidence: number;
};

export async function suggestFromReceipt(file: File): Promise<ReceiptSuggestion | null> {
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
                text: `You read Indian farm and shop bills for ET Samanya Farms, Thenkulapakkam, Tamil Nadu.
Extract the voucher from this photo. Return ONLY JSON with keys:
kind, vendor, amount, date, gstin, invoiceNo, hsn, gstRate, gstKind, inclusive, cgst, sgst, igst, paymentMode, category, narration, confidence.
kind is expense or income (almost always expense for a bill).
amount is gross rupees (number).
date is YYYY-MM-DD if printed, else null.
gstin is 15-char GSTIN or null.
gstRate is 0,5,12,18,28.
gstKind is none, exempt, intra, or inter. Tamil Nadu shop = intra. Fresh agri produce often exempt.
inclusive is true if GST is already in the total.
cgst,sGst,igst are rupees or null.
paymentMode is cash, upi, bank, cheque, card, or credit.
category is a short English phrase (labour, seeds, diesel, vegetables, stay...).
confidence 0-1.
If it is not a bill, confidence low and amount null.`,
              },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
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
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const kind = isVoucherKind(String(parsed.kind)) ? (parsed.kind as VoucherKind) : "expense";
    const paymentMode = isPaymentMode(String(parsed.paymentMode))
      ? (parsed.paymentMode as PaymentMode)
      : "cash";
    const gstKind = isGstKind(String(parsed.gstKind)) ? (parsed.gstKind as GstKind) : "none";
    const vendor = parsed.vendor ? String(parsed.vendor) : null;
    const narration = String(parsed.narration || vendor || "Bill");
    const rateRaw = Number(parsed.gstRate);
    const gstRate = [0, 5, 12, 18, 28].includes(rateRaw) ? rateRaw : 0;
    return {
      kind: kind === "transfer" || kind === "journal" ? "expense" : kind,
      vendor,
      amountPaise: rupeesToPaise(parsed.amount as string | number),
      date: parsed.date ? String(parsed.date) : null,
      gstin: parsed.gstin ? String(parsed.gstin).toUpperCase() : null,
      invoiceNo: parsed.invoiceNo ? String(parsed.invoiceNo) : null,
      hsn: parsed.hsn ? String(parsed.hsn) : null,
      gstRate,
      gstKind,
      inclusive: parsed.inclusive !== false,
      cgstPaise: rupeesToPaise(parsed.cgst as string | number),
      sgstPaise: rupeesToPaise(parsed.sgst as string | number),
      igstPaise: rupeesToPaise(parsed.igst as string | number),
      paymentMode,
      categoryAccountId: suggestCategoryId(`${vendor ?? ""} ${parsed.category ?? ""} ${narration}`, kind),
      narration,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    };
  } catch {
    return null;
  }
}
