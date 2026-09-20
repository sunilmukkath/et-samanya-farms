import { rotateSmsTokenAction, saveGstinAction } from "@/app/admin/books-actions";
import { booksSnapshot, canPersistFarmData, getBookSettings } from "@/db/queries";
import { requireOperator } from "@/lib/admin";
import { accountById, formatInr, voucherKindLabel } from "@/lib/accounts";
import { timeAgo } from "@/lib/farm";
import { site } from "@/lib/site";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BooksHomePage() {
  await requireOperator();
  const persist = canPersistFarmData();
  const snap = persist ? await booksSnapshot() : null;
  const settings = persist ? await getBookSettings() : null;
  const ingestUrl = `${site.url.replace(/\/$/, "")}/api/accounts/sms`;

  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-8">
      <p className="font-tamil text-sm text-clay">கணக்கு</p>
      <h1 className="font-display text-3xl sm:text-4xl">Accounts books</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Cash, UPI and bank for this farm. Indian FY {snap?.fy.label ?? "—"}. Type a line, photograph a bill, or paste an SMS — one step at a time.
      </p>

      <section className="mt-5 rounded-[1.75rem] bg-leaf-deep px-5 py-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">This month</p>
        <p className="mt-2 font-display text-4xl leading-none">{formatInr((snap?.monthIn ?? 0) - (snap?.monthOut ?? 0))}</p>
        <p className="mt-2 text-sm text-sand">
          In {formatInr(snap?.monthIn ?? 0)} · Out {formatInr(snap?.monthOut ?? 0)}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Cash" value={formatInr(snap?.cash ?? 0)} />
        <Stat label="Bank" value={formatInr(snap?.bank ?? 0)} />
        <Stat label="UPI" value={formatInr(snap?.upi ?? 0)} />
      </div>

      <div className="mt-5 grid gap-2">
        <Link href="/admin/books/new" className="tap flex items-center justify-center rounded-full bg-leaf-deep font-semibold text-cream">
          Record expense
        </Link>
        <Link href="/admin/books/new?kind=income" className="tap flex items-center justify-center rounded-full bg-leaf font-semibold text-leaf-deep">
          Record income
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/books/new?kind=transfer" className="tap flex items-center justify-center rounded-full border border-line bg-white text-sm font-semibold">
            Contra
          </Link>
          <Link href="/admin/books/new?via=sms" className="tap flex items-center justify-center rounded-full border border-line bg-white text-sm font-semibold">
            Paste SMS
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Link href="/admin/books/reports" className="tap flex items-center justify-center rounded-full border border-line bg-white font-semibold">
          P&amp;L / GST
        </Link>
        <Link href="/admin/books/ledgers" className="tap flex items-center justify-center rounded-full border border-line bg-white font-semibold">
          Ledgers
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Day book</h2>
        {!snap?.vouchers.length ? (
          <p className="mt-3 rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            Nothing posted in {snap?.fy.label ?? "this FY"} yet. Start with an expense — seed, coolie, or diesel.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
            {snap.vouchers.slice(0, 20).map((row) => (
              <li key={row.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {row.number} · {voucherKindLabel(row.kind)} · {timeAgo(row.occurredAt)}
                    </p>
                    <p className="truncate font-display text-xl leading-tight">
                      {row.partyName || accountById[row.categoryAccountId]?.name || "Voucher"}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {row.narration || accountById[row.categoryAccountId]?.name} · {row.paymentMode}
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

      <section className="mt-8 rounded-3xl bg-cream px-4 py-5">
        <h2 className="font-display text-2xl">SMS from the phone</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Forward bank SMS with Tasker or an Android gateway. POST the body to this URL with the farm SMS token.
        </p>
        <p className="mt-3 break-all rounded-2xl bg-leaf-deep px-3 py-3 font-mono text-[11px] text-sand">{ingestUrl}</p>
        <p className="mt-2 break-all font-mono text-xs text-ink-soft">Token: {settings?.smsToken ?? "—"}</p>
        <form action={rotateSmsTokenAction}>
          <button type="submit" className="tap mt-2 rounded-full border border-line px-4 text-xs font-semibold">
            New SMS token
          </button>
        </form>
        <form className="mt-4 space-y-2" action={saveGstinAction}>
          <input name="gstin" defaultValue={settings?.gstin ?? ""} placeholder="Farm GSTIN" className="tap w-full rounded-2xl border border-line bg-white px-3 text-sm" />
          <input name="pan" defaultValue={settings?.pan ?? ""} placeholder="PAN" className="tap w-full rounded-2xl border border-line bg-white px-3 text-sm" />
          <button type="submit" className="tap w-full rounded-full bg-leaf-deep px-4 text-sm font-semibold text-cream">
            Save GSTIN / PAN
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white px-3 py-3">
      <p className="truncate font-display text-lg leading-tight">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
