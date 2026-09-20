"use client";

import { createVoucherAction, parseSmsAction, readBillAction } from "@/app/admin/books-actions";
import {
  accountsForKind,
  gstRates,
  istInputDate,
  paymentModeLabel,
  paymentModes,
  voucherKindLabel,
  voucherKinds,
  walletForMode,
  type ChartAccount,
  type GstKind,
  type PaymentMode,
  type VoucherKind,
} from "@/lib/accounts";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass =
  "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";

type CaptureMode = "manual" | "photo" | "sms";

export function BooksCapture({
  defaultKind = "expense",
  defaultMode = "manual",
  visionOn,
}: {
  defaultKind?: VoucherKind;
  defaultMode?: CaptureMode;
  visionOn: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>(defaultMode);
  const [kind, setKind] = useState<VoucherKind>(defaultKind);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [smsText, setSmsText] = useState("");
  const [amount, setAmount] = useState("");
  const [partyName, setPartyName] = useState("");
  const [occurredOn, setOccurredOn] = useState(istInputDate(new Date()));
  const [narration, setNarration] = useState("");
  const [categoryAccountId, setCategoryAccountId] = useState(kind === "income" ? "sales_veg" : "exp_misc");
  const [gstKind, setGstKind] = useState<GstKind>(kind === "income" ? "exempt" : "none");
  const [gstRate, setGstRate] = useState("0");
  const [gstin, setGstin] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [smsHash, setSmsHash] = useState("");
  const [confidence, setConfidence] = useState<string | null>(null);

  const categories = useMemo(() => accountsForKind(kind === "transfer" ? "transfer" : kind), [kind]);
  const walletId = walletForMode(paymentMode, kind);

  function applyKind(next: VoucherKind) {
    setKind(next);
    setCategoryAccountId(next === "income" ? "sales_veg" : next === "transfer" ? "bank" : "exp_misc");
    setGstKind(next === "income" ? "exempt" : "none");
    setGstRate("0");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["manual", "photo", "sms"] as CaptureMode[]).map((item) => (
          <button
            key={item}
            type="button"
            data-on={mode === item ? "true" : "false"}
            className="admin-chip shrink-0"
            onClick={() => setMode(item)}
          >
            {item === "manual" ? "Type it" : item === "photo" ? "Bill photo" : "Bank SMS"}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        <form
          className="rounded-3xl border border-line bg-white p-4 space-y-3"
          action={(formData) => {
            setMessage(null);
            start(async () => {
              const result = await readBillAction(formData);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              const s = result.suggestion;
              applyKind(s.kind);
              setAmount(s.amount);
              setPartyName(s.vendor ?? "");
              if (s.date) setOccurredOn(s.date);
              setNarration(s.narration);
              setCategoryAccountId(s.categoryAccountId);
              setGstKind(s.gstKind);
              setGstRate(String(s.gstRate));
              setPaymentMode(s.paymentMode);
              setGstin(s.gstin ?? "");
              setInvoiceNo(s.invoiceNo ?? "");
              setPhotoUrl(s.photoUrl ?? "");
              setConfidence(`${Math.round(s.confidence * 100)}% read`);
              setMode("manual");
            });
          }}
        >
          <p className="text-sm text-ink-soft">
            Photograph the shop bill. Gemini reads vendor, amount, GSTIN and GST. Then you confirm.
            {!visionOn
              ? " Vision is off — attach the photo in the form below, type the amount, and post. Set GEMINI_API_KEY to auto-read bills."
              : ""}
          </p>
          {visionOn ? (
            <>
              <input name="photo" type="file" accept="image/*" capture="environment" required className={fieldClass} />
              <button
                type="submit"
                disabled={pending}
                className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream disabled:opacity-60"
              >
                {pending ? "Reading…" : "Read this bill"}
              </button>
            </>
          ) : null}
        </form>
      ) : null}

      {mode === "sms" ? (
        <form
          className="rounded-3xl border border-line bg-white p-4 space-y-3"
          action={(formData) => {
            setMessage(null);
            start(async () => {
              const result = await parseSmsAction(formData);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              const s = result.parsed;
              applyKind(s.kind);
              setAmount(s.amount);
              setPartyName(s.party ?? "");
              if (s.occurredAt) setOccurredOn(s.occurredAt.slice(0, 10));
              setNarration(s.narration);
              setCategoryAccountId(s.categoryAccountId);
              setPaymentMode(s.paymentMode);
              setSmsText(formData.get("sms") ? String(formData.get("sms")) : smsText);
              setSmsHash(s.fingerprint);
              setConfidence(`${Math.round(s.confidence * 100)}% parse`);
              setMode("manual");
            });
          }}
        >
          <p className="text-sm text-ink-soft">
            Paste an SBI / HDFC / UPI / PhonePe debit or credit SMS. Or forward from the phone to the
            ingest URL on the books home.
          </p>
          <textarea
            name="sms"
            rows={5}
            required
            value={smsText}
            onChange={(event) => setSmsText(event.target.value)}
            placeholder="Rs.1,250.00 debited from A/c XX1234…"
            className={`${fieldClass} py-3`}
          />
          <button
            type="submit"
            disabled={pending}
            className="tap w-full rounded-full bg-leaf-deep text-sm font-semibold text-cream disabled:opacity-60"
          >
            {pending ? "Parsing…" : "Parse SMS"}
          </button>
        </form>
      ) : null}

      <form
        className="space-y-3 rounded-3xl border border-line bg-white p-4"
        action={(formData) => {
          setMessage(null);
          start(async () => {
            const result = await createVoucherAction(formData);
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            router.push("/admin/books");
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="photoUrl" value={photoUrl} />
        <input type="hidden" name="smsRaw" value={smsText} />
        <input type="hidden" name="smsHash" value={smsHash} />
        <input type="hidden" name="walletAccountId" value={walletId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Kind</span>
            <select
              name="kind"
              className={fieldClass}
              value={kind}
              onChange={(event) => applyKind(event.target.value as VoucherKind)}
            >
              {voucherKinds
                .filter((item) => item !== "journal")
                .map((item) => (
                  <option key={item} value={item}>
                    {voucherKindLabel(item)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Date</span>
            <input name="occurredOn" type="date" className={fieldClass} value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Amount (₹)</span>
          <input
            name="amount"
            inputMode="decimal"
            required
            placeholder="1250.00"
            className={fieldClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {kind === "income" ? "From (party)" : "Paid to"}
          </span>
          <input name="partyName" className={fieldClass} value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Name, shop, or UPI" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Head</span>
            <select
              name="categoryAccountId"
              className={fieldClass}
              value={categoryAccountId}
              onChange={(e) => setCategoryAccountId(e.target.value)}
            >
              {categories.map((row: ChartAccount) => (
                <option key={row.id} value={row.id}>
                  {row.code} {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Paid by</span>
            <select
              name="paymentMode"
              className={fieldClass}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              {paymentModes.map((item) => (
                <option key={item} value={item}>
                  {paymentModeLabel(item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {kind === "transfer" ? (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Into</span>
            <select name="transferToId" className={fieldClass} defaultValue="bank">
              {accountsForKind("transfer").map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">GST</span>
            <select name="gstKind" className={fieldClass} value={gstKind} onChange={(e) => setGstKind(e.target.value as GstKind)}>
              <option value="none">No GST</option>
              <option value="exempt">Exempt (agri)</option>
              <option value="intra">TN CGST+SGST</option>
              <option value="inter">IGST (other state)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Rate</span>
            <select name="gstRate" className={fieldClass} value={gstRate} onChange={(e) => setGstRate(e.target.value)}>
              {gstRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Tax in amount</span>
            <select name="inclusive" className={fieldClass} defaultValue="1">
              <option value="1">Inclusive</option>
              <option value="0">Add GST</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">GSTIN</span>
            <input name="gstin" className={fieldClass} value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="33………ZN" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Bill no</span>
            <input name="invoiceNo" className={fieldClass} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Narration</span>
          <textarea name="narration" rows={2} className={`${fieldClass} py-3`} value={narration} onChange={(e) => setNarration(e.target.value)} />
        </label>

        {photoUrl ? (
          <p className="text-xs text-leaf-deep">Bill photo attached. Check the figures, then post.</p>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Attach bill {mode === "photo" ? "" : "(optional)"}
            </span>
            <input name="photo" type="file" accept="image/*" capture="environment" className={fieldClass} />
          </label>
        )}

        {confidence ? <p className="text-xs text-leaf-deep">{confidence}. Check the figures, then post.</p> : null}
        {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="tap w-full rounded-full bg-leaf-deep text-base font-semibold text-cream disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post to the books"}
        </button>
      </form>
    </div>
  );
}
