import { createLedgerAction } from "@/app/admin/actions";
import { listLedger } from "@/db/queries";
import { requireOperator } from "@/lib/admin";
import { timeAgo } from "@/lib/farm";
import { getRuntimeFarm } from "@/lib/profile";

export default async function LedgerPage() {
  await requireOperator();
  const [rows, runtime] = await Promise.all([listLedger(), getRuntimeFarm()]);
  const income = rows.filter((row) => row.kind === "income").reduce((sum, row) => sum + row.amount, 0);
  const expense = rows.filter((row) => row.kind === "expense").reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Ledger</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enough to see if a crop paid — not GST books. Operators only.
      </p>
      <p className="mt-4 font-display text-2xl">
        Net ₹{(income - expense).toFixed(0)}{" "}
        <span className="text-base font-sans text-muted">
          in {income.toFixed(0)} · out {expense.toFixed(0)}
        </span>
      </p>

      <form action={createLedgerAction} className="mt-5 grid grid-cols-2 gap-3 rounded-3xl border border-line bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Kind</span>
          <select name="kind" className="tap w-full rounded-2xl border border-line px-3">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">₹</span>
          <input name="amount" type="number" step="1" required className="tap w-full rounded-2xl border border-line px-3" />
        </label>
        <label className="block col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Category</span>
          <select name="category" className="tap w-full rounded-2xl border border-line px-3">
            {runtime.ledgerCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Note</span>
          <input name="note" className="tap w-full rounded-2xl border border-line px-3" />
        </label>
        <button type="submit" className="tap col-span-2 rounded-full bg-leaf-deep text-sm font-semibold text-cream">
          Add line
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between rounded-2xl border border-line bg-white px-4 py-3 text-sm">
            <span>
              {row.category}
              {row.note ? ` · ${row.note}` : ""}
              <span className="block text-xs text-muted">{timeAgo(row.occurredAt)}</span>
            </span>
            <span className={row.kind === "income" ? "font-semibold text-leaf-deep" : "font-semibold"}>
              {row.kind === "income" ? "+" : "−"}₹{row.amount.toFixed(0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
