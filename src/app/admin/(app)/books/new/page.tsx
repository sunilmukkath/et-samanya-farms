import { BooksCapture } from "@/components/admin/BooksForms";
import { isVisionConfigured } from "@/lib/farm";

export const dynamic = "force-dynamic";

export default async function NewVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; via?: string }>;
}) {
  const params = await searchParams;
  const kind = params.kind === "income" || params.kind === "transfer" ? params.kind : "expense";
  const via = params.via;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Samanya books</p>
      <h1 className="font-display text-4xl">
        {kind === "income" ? "Record income" : kind === "transfer" ? "Cash to bank" : "Record an expense"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Indian FY (April–March), GST if the bill has it, cash or UPI or udhaar. Photograph a bill or
        paste a bank SMS — then check and post. Every post is a balanced voucher.
      </p>
      <div className="mt-5">
        <BooksCapture defaultKind={kind} visionOn={isVisionConfigured()} />
      </div>
      {via === "sms" ? (
        <p className="mt-4 text-xs text-muted">Open the Bank SMS chip if the paste box is not showing.</p>
      ) : null}
    </div>
  );
}
