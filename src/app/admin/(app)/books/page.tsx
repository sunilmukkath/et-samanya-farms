import { rotateSmsTokenAction, saveGstinAction } from "@/app/admin/books-actions";
import { booksSnapshot, canPersistFarmData, getBookSettings } from "@/db/queries";
import { accountById, formatInr, voucherKindLabel } from "@/lib/accounts";
import { timeAgo } from "@/lib/farm";
import { site } from "@/lib/site";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BooksHomePage() {
  const persist = canPersistFarmData();
  const snap = persist ? await booksSnapshot() : null;
  const settings = persist ? await getBookSettings() : null;
  const ingestUrl = `${site.url.replace(/\/$/, "")}/api/accounts/sms`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">கணக்கு · Books</p>
      <h1 className="font-display text-4xl">Farm books, Indian style.</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Double-entry for ET Samanya Foods. FY {snap?.fy.label ?? "—"}. Cash, UPI and bank. GST when
        a bill has it. Fresh produce sales default to agri-exempt. Capture from a typed voucher, a
        photographed bill, or a bank SMS.
      </p>

      <section className="mt-5 rounded-3xl bg-leaf-deep px-5 py-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">This month</p>
        <p className="mt-2 font-display text-3xl">
          {formatInr((snap?.monthIn ?? 0) - (snap?.monthOut ?? 0))}
        </p>
        <p className="mt-1 text-sm text-sand">
          In {formatInr(snap?.monthIn ?? 0)} · Out {formatInr(snap?.monthOut ?? 0)}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Cash" value={formatInr(snap?.cash ?? 0)} />
        <Stat label="Bank" value={formatInr(snap?.bank ?? 0)} />
        <Stat label="UPI" value={formatInr(snap?.upi ?? 0)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label={`${snap?.fy.label ?? ""} income`} value={formatInr(snap?.income ?? 0)} />
        <Stat label="Expenses" value={formatInr(snap?.expense ?? 0)} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Surplus {formatInr(snap?.profit ?? 0)} · Input GST {formatInr(snap?.inputGst ?? 0)} · Output GST{" "}
        {formatInr(snap?.outputGst ?? 0)}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/books/new" className="tap flex items-center justify-center rounded-full bg-leaf-deep font-semibold text-cream">
          Expense
        </Link>
        <Link href="/admin/books/new?kind=income" className="tap flex items-center justify-center rounded-full bg-leaf font-semibold text-leaf-deep">
          Income
        </Link>
        <Link href="/admin/books/new?kind=transfer" className="tap flex items-center justify-center rounded-full border border-line bg-white font-semibold">
          Contra
        </Link>
      </div>

      <div className="mt-3 flex gap-3 text-sm">
        <Link href="/admin/books/new?via=sms" className="font-semibold text-leaf underline-draw">
          Paste SMS
        </Link>
        <Link href="/admin/books/reports" className="font-semibold text-leaf underline-draw">
          P&L and GST
        </Link>
        <Link href="/admin/books/ledgers" className="font-semibold text-leaf underline-draw">
          Ledgers
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Day book</h2>
        {!snap?.vouchers.length ? (
          <p className="mt-3 rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            No vouchers in {snap?.fy.label ?? "this FY"} yet. Photograph a bill or paste this morning&apos;s
            UPI SMS.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white">
            {snap.vouchers.slice(0, 20).map((row) => (
              <li key={row.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {row.number} · {voucherKindLabel(row.kind)} · {timeAgo(row.occurredAt)}
                    </p>
                    <p className="font-display text-xl leading-tight">
                      {row.partyName || accountById[row.categoryAccountId]?.name || "Voucher"}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {row.narration || accountById[row.categoryAccountId]?.name} · {row.paymentMode}
                      {row.source !== "manual" ? ` · ${row.source}` : ""}
                    </p>
                  </div>
                  <p className={`shrink-0 font-semibold ${row.kind === "income" ? "text-leaf-deep" : "text-ink"}`}>
                    {row.kind === "income" ? "+" : row.kind === "expense" ? "−" : ""}
                    {formatInr(row.grossPaise)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-cream px-5 py-5">
        <h2 className="font-display text-2xl">SMS from the phone</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Forward bank SMS with Tasker, IFTTT, or an Android SMS gateway. POST the message body to
          this URL with the farm SMS token. Duplicates are ignored.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-leaf-deep p-4 text-xs leading-relaxed text-sand">
{`curl -X POST ${ingestUrl} \\
  -H "Authorization: Bearer SMS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Rs.500.00 debited from A/c XX12 via UPI"}'`}
        </pre>
        <p className="mt-3 break-all font-mono text-xs text-ink-soft">
          Token: {settings?.smsToken ?? "—"}
        </p>
        <form action={rotateSmsTokenAction}>
          <button type="submit" className="tap mt-2 rounded-full border border-line px-4 text-xs font-semibold">
            New SMS token
          </button>
        </form>
        <form className="mt-4 grid gap-2 sm:grid-cols-2" action={saveGstinAction}>
          <input name="gstin" defaultValue={settings?.gstin ?? ""} placeholder="Farm GSTIN" className="tap rounded-2xl border border-line bg-white px-3 text-sm" />
          <input name="pan" defaultValue={settings?.pan ?? ""} placeholder="PAN" className="tap rounded-2xl border border-line bg-white px-3 text-sm" />
          <button type="submit" className="tap rounded-full bg-leaf-deep px-4 text-sm font-semibold text-cream sm:col-span-2">
            Save GSTIN / PAN
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white px-4 py-4">
      <p className="font-display text-xl leading-tight">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
