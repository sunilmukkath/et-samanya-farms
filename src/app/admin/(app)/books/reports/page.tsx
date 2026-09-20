import { booksSnapshot, listBookAccounts, listLines, listVouchers } from "@/db/queries";
import { requireOperator } from "@/lib/admin";
import { formatInr } from "@/lib/accounts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BooksReportsPage() {
  await requireOperator();
  const snap = await booksSnapshot();
  const accounts = await listBookAccounts();
  const vouchers = await listVouchers({ fy: snap.fy.label, limit: 500 });
  const lines = await listLines({ limit: 4000 });
  const ids = new Set(vouchers.map((row) => row.id));
  const fyLines = lines.filter((row) => ids.has(row.voucherId));

  const incomeRows = accounts.filter((row) => row.type === "income");
  const expenseRows = accounts.filter((row) => row.type === "expense");

  function movement(accountId: string) {
    let debit = 0;
    let credit = 0;
    for (const line of fyLines) {
      if (line.accountId !== accountId) continue;
      debit += line.debitPaise;
      credit += line.creditPaise;
    }
    return { debit, credit };
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">FY {snap.fy.label}</p>
      <h1 className="font-display text-3xl sm:text-4xl">Profit &amp; loss</h1>
      <p className="mt-2 text-sm text-ink-soft">April to March. Agri sales sit in exempt heads. This is a working summary, not a GSTR filing.</p>

      <section className="mt-6">
        <h2 className="font-display text-2xl">Income</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {incomeRows.map((row) => {
            const m = movement(row.id);
            const value = m.credit - m.debit;
            if (!value) return null;
            return (
              <li key={row.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  {row.name}{" "}
                  <span className="font-tamil text-muted">{row.tamil}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatInr(value)}</span>
              </li>
            );
          })}
          <li className="flex justify-between px-4 py-3 text-sm font-semibold">
            <span>Total income</span>
            <span>{formatInr(snap.income)}</span>
          </li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl">Expenses</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {expenseRows.map((row) => {
            const m = movement(row.id);
            const value = m.debit - m.credit;
            if (!value) return null;
            return (
              <li key={row.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span>{row.name}</span>
                <span className="font-semibold">{formatInr(value)}</span>
              </li>
            );
          })}
          <li className="flex justify-between px-4 py-3 text-sm font-semibold">
            <span>Total expenses</span>
            <span>{formatInr(snap.expense)}</span>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-leaf-deep px-5 py-5 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sun">Surplus</p>
        <p className="mt-2 font-display text-4xl">{formatInr(snap.profit)}</p>
        <p className="mt-2 text-sm text-sand">
          Input GST {formatInr(snap.inputGst)} · Output GST {formatInr(snap.outputGst)}
        </p>
      </section>

      <p className="mt-6 text-sm">
        <Link href="/admin/books" className="font-semibold text-leaf-deep">
          Back to the day book
        </Link>
      </p>
    </div>
  );
}
