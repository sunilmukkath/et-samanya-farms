"use client";

import { createVoucherAction, parseSmsAction, readBillAction } from "@/app/admin/books-actions";
import { FlowSteps } from "@/components/admin/FlowSteps";
import {
  accountsForKind,
  gstRates,
  istInputDate,
  paymentModeLabel,
  paymentModes,
  voucherKindLabel,
  walletForMode,
  type ChartAccount,
  type GstKind,
  type PaymentMode,
  type VoucherKind,
} from "@/lib/accounts";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const fieldClass = "tap w-full rounded-2xl border border-line bg-white px-3 text-base text-ink";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

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
  const [kind, setKind] = useState<VoucherKind>(defaultKind === "journal" ? "expense" : defaultKind);
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
  const [showGst, setShowGst] = useState(false);
  const [step, setStep] = useState(0);

  const categories = useMemo(() => accountsForKind(kind === "transfer" ? "transfer" : kind), [kind]);
  const walletId = walletForMode(paymentMode, kind);
  const captureFirst = mode === "photo" || mode === "sms";
  const steps = captureFirst
    ? ["How", "Read it", "Amount", "Head", "Who", "Save"]
    : ["How", "Amount", "Head", "Who", "Save"];
  const last = step >= steps.length - 1;

  function applyKind(next: VoucherKind) {
    setKind(next);
    setCategoryAccountId(next === "income" ? "sales_veg" : next === "transfer" ? "bank" : "exp_misc");
    setGstKind(next === "income" ? "exempt" : "none");
    setGstRate("0");
  }

  function goNext() {
    setMessage(null);
    if (steps[step] === "Amount" && !amount) {
      setMessage("Enter an amount in rupees.");
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  return (
    <div className="space-y-4 pb-24">
      <FlowSteps current={step + 1} total={steps.length} label={steps[step]} />

      <section className={step === 0 ? "space-y-4" : "hidden"}>
        <p className={labelClass}>What are you posting?</p>
        <div className="grid grid-cols-1 gap-2">
          {(["expense", "income", "transfer"] as VoucherKind[]).map((item) => (
            <button
              key={item}
              type="button"
              data-on={kind === item ? "true" : "false"}
              className="admin-chip justify-center"
              onClick={() => applyKind(item)}
            >
              {voucherKindLabel(item)}
            </button>
          ))}
        </div>
        <p className={labelClass}>How do you have it?</p>
        <div className="grid grid-cols-1 gap-2">
          {(["manual", "photo", "sms"] as CaptureMode[]).map((item) => (
            <button
              key={item}
              type="button"
              data-on={mode === item ? "true" : "false"}
              className="admin-chip justify-center"
              onClick={() => setMode(item)}
            >
              {item === "manual" ? "Type the amount" : item === "photo" ? "Photograph the bill" : "Paste a bank SMS"}
            </button>
          ))}
        </div>
      </section>

      {captureFirst ? (
        <section className={step === 1 ? "space-y-3" : "hidden"}>
          {mode === "photo" ? (
            <form
              className="space-y-3 rounded-3xl border border-line bg-white p-4"
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
                  setConfidence(s.confidence ? `${Math.round(s.confidence * 100)}% read` : "Photo attached");
                  setStep(2);
                });
              }}
            >
              <p className="text-sm text-ink-soft">
                Photograph the shop bill.
                {visionOn ? " Gemini reads vendor, amount, and GST — then you confirm." : " Vision is off, so attach the photo and type the amount on the next screen."}
              </p>
              <input name="photo" type="file" accept="image/*" capture="environment" required className={fieldClass} />
              <div className="flex gap-2">
                <button type="button" className="tap flex-1 rounded-full border border-line font-semibold" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="submit" disabled={pending} className="tap flex-[2] rounded-full bg-leaf-deep text-sm font-semibold text-cream disabled:opacity-60">
                  {pending ? "Reading…" : visionOn ? "Read this bill" : "Attach and continue"}
                </button>
              </div>
            </form>
          ) : (
            <form
              className="space-y-3 rounded-3xl border border-line bg-white p-4"
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
                  setStep(2);
                });
              }}
            >
              <p className="text-sm text-ink-soft">Paste an SBI / HDFC / UPI debit or credit SMS.</p>
              <textarea
                name="sms"
                rows={6}
                required
                value={smsText}
                onChange={(event) => setSmsText(event.target.value)}
                placeholder="Rs.1,250.00 debited from A/c XX1234…"
                className={`${fieldClass} py-3`}
              />
              <div className="flex gap-2">
                <button type="button" className="tap flex-1 rounded-full border border-line font-semibold" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="submit" disabled={pending} className="tap flex-[2] rounded-full bg-leaf-deep text-sm font-semibold text-cream disabled:opacity-60">
                  {pending ? "Parsing…" : "Parse SMS"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      <form
        className="space-y-4"
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
        onSubmit={(event) => {
          if (!last) {
            event.preventDefault();
            goNext();
          }
        }}
      >
        <input type="hidden" name="photoUrl" value={photoUrl} />
        <input type="hidden" name="smsRaw" value={smsText} />
        <input type="hidden" name="smsHash" value={smsHash} />
        <input type="hidden" name="walletAccountId" value={walletId} />
        <input type="hidden" name="kind" value={kind} />

        <section className={steps[step] === "Amount" ? "space-y-3" : "hidden"}>
          <label className="block">
            <span className={labelClass}>Amount (₹)</span>
            <input
              name="amount"
              inputMode="decimal"
              required={false}
              placeholder="1250"
              className={fieldClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Date</span>
            <input name="occurredOn" type="date" className={fieldClass} value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
          </label>
        </section>

        <section className={steps[step] === "Head" ? "space-y-3" : "hidden"}>
          <p className={labelClass}>{kind === "income" ? "Income head" : kind === "transfer" ? "Move into" : "Expense head"}</p>
          <input type="hidden" name="categoryAccountId" value={categoryAccountId} />
          <div className="grid grid-cols-1 gap-2">
            {categories.map((row: ChartAccount) => (
              <button
                key={row.id}
                type="button"
                data-on={categoryAccountId === row.id ? "true" : "false"}
                className="admin-chip min-h-12 justify-between gap-2 text-left"
                onClick={() => setCategoryAccountId(row.id)}
              >
                <span>{row.name}</span>
                <span className="font-tamil text-xs font-normal opacity-80">{row.tamil}</span>
              </button>
            ))}
          </div>
          {kind === "transfer" ? (
            <label className="block">
              <span className={labelClass}>Into</span>
              <select name="transferToId" className={fieldClass} defaultValue="bank">
                {accountsForKind("transfer").map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className={labelClass}>Paid by</p>
          <input type="hidden" name="paymentMode" value={paymentMode} />
          <div className="grid grid-cols-2 gap-2">
            {paymentModes.map((item) => (
              <button
                key={item}
                type="button"
                data-on={paymentMode === item ? "true" : "false"}
                className="admin-chip justify-center text-center"
                onClick={() => setPaymentMode(item)}
              >
                {paymentModeLabel(item)}
              </button>
            ))}
          </div>
        </section>

        <section className={steps[step] === "Who" || steps[step] === "Save" ? "space-y-3" : "hidden"}>
          <label className="block">
            <span className={labelClass}>{kind === "income" ? "From" : "Paid to"}</span>
            <input name="partyName" className={fieldClass} value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Name, shop, or UPI" />
          </label>
          <label className="block">
            <span className={labelClass}>Narration</span>
            <textarea name="narration" rows={2} className={`${fieldClass} py-3`} value={narration} onChange={(e) => setNarration(e.target.value)} />
          </label>
          {photoUrl ? (
            <p className="text-sm text-leaf-deep">Bill photo attached.</p>
          ) : (
            <label className="block">
              <span className={labelClass}>Bill photo (optional)</span>
              <input name="photo" type="file" accept="image/*" capture="environment" className={fieldClass} />
            </label>
          )}
        </section>

        <section className={steps[step] === "Save" ? "space-y-3" : "hidden"}>
          {confidence ? <p className="text-sm text-leaf-deep">{confidence}. Check the figures, then post.</p> : null}
          <p className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm">
            {voucherKindLabel(kind)} · ₹{amount || "—"} · {categories.find((row) => row.id === categoryAccountId)?.name} · {paymentModeLabel(paymentMode)}
          </p>
          <button type="button" className="text-sm font-semibold text-leaf-deep" onClick={() => setShowGst((open) => !open)}>
            {showGst ? "Hide GST" : "GST / bill number (optional)"}
          </button>
          <div className={showGst ? "space-y-3" : "hidden"}>
            <label className="block">
              <span className={labelClass}>GST</span>
              <select name="gstKind" className={fieldClass} value={gstKind} onChange={(e) => setGstKind(e.target.value as GstKind)}>
                <option value="none">No GST</option>
                <option value="exempt">Exempt (agri)</option>
                <option value="intra">TN CGST+SGST</option>
                <option value="inter">IGST (other state)</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Rate</span>
              <select name="gstRate" className={fieldClass} value={gstRate} onChange={(e) => setGstRate(e.target.value)}>
                {gstRates.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Tax in amount</span>
              <select name="inclusive" className={fieldClass} defaultValue="1">
                <option value="1">Inclusive</option>
                <option value="0">Add GST</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>GSTIN</span>
              <input name="gstin" className={fieldClass} value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="33………ZN" />
            </label>
            <label className="block">
              <span className={labelClass}>Bill no</span>
              <input name="invoiceNo" className={fieldClass} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </label>
          </div>
        </section>

        {message ? <p className="text-sm font-semibold text-clay">{message}</p> : null}

        {!(captureFirst && step === 1) ? (
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-paper px-4 py-3">
            <div className="flex gap-2">
              {step > 0 ? (
                <button type="button" className="tap flex-1 rounded-full border border-line font-semibold" onClick={() => setStep((value) => Math.max(0, value - 1))}>
                  Back
                </button>
              ) : null}
              <button
                type={last ? "submit" : "button"}
                disabled={pending}
                onClick={last ? undefined : goNext}
                className="tap flex-[2] rounded-full bg-leaf-deep text-base font-semibold text-cream disabled:opacity-60"
              >
                {pending ? "Posting…" : last ? "Post to the books" : "Next"}
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
