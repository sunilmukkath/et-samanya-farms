import { listBookAccounts, listLines, listVouchers } from "@/db/queries";
import { formatInr } from "@/lib/accounts";
import { timeAgo } from "@/lib/farm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LedgersPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  const accounts = await listBookAccounts();
  const current = accounts.find((row) => row.id === account) ?? accounts.find((row) => row.id === "cash") ?? accounts[0];
  const lines = current ? await listLines({ accountId: current.id, limit: 200 }) : [];
  const vouchers = await listVouchers({ limit: 400 });
  const byId = Object.fromEntries(vouchers.map((row) => [row.id, row]));
  const chronological = [...lines].reverse();
  const rows = chronological.reduce(
    (acc, line) => {
      const running = (acc.at(-1)?.running ?? 0) + line.debitPaise - line.creditPaise;
      acc.push({ line, running, voucher: byId[line.voucherId] });
      return acc;
    },
    [] as { line: (typeof lines)[number]; running: number; voucher: (typeof vouchers)[number] | undefined }[],
  ).reverse();

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Ledgers</p>
      <h1 className="font-display text-4xl">{current?.name ?? "Ledger"}</h1>
      <p className="mt-1 font-tamil text-sm text-muted">{current?.tamil}</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {accounts
          .filter((row) => ["cash", "bank", "upi", "creditors", "debtors"].includes(row.id) || row.type === "expense" || row.type === "income")
          .map((row) => (
            <Link
              key={row.id}
              href={`/admin/books/ledgers?account=${row.id}`}
              data-on={current?.id === row.id ? "true" : "false"}
              className="admin-chip shrink-0"
            >
              {row.name}
            </Link>
          ))}
      </div>

      <ul className="mt-5 divide-y divide-line rounded-3xl border border-line bg-white">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-ink-soft">Nothing posted to this head yet.</li>
        ) : (
          rows.map(({ line, running, voucher }) => (
            <li key={line.id} className="px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {voucher?.number ?? "—"} · {timeAgo(voucher?.occurredAt ?? line.createdAt)}
                  </p>
                  <p>{voucher?.partyName || voucher?.narration || "Entry"}</p>
                </div>
                <div className="text-right">
                  <p>{line.debitPaise ? `Dr ${formatInr(line.debitPaise)}` : `Cr ${formatInr(line.creditPaise)}`}</p>
                  <p className="text-xs text-muted">{formatInr(running)}</p>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
