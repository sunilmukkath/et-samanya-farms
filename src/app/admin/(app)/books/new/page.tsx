import { BooksCapture } from "@/components/admin/BooksForms";
import { requireOperator } from "@/lib/admin";
import { isVisionConfigured } from "@/lib/farm";

export const dynamic = "force-dynamic";

export default async function NewVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; via?: string }>;
}) {
  await requireOperator();
  const params = await searchParams;
  const kind = params.kind === "income" || params.kind === "transfer" ? params.kind : "expense";
  const via = params.via === "sms" || params.via === "photo" ? params.via : "manual";

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <p className="font-tamil text-sm text-clay">கணக்கு</p>
      <h1 className="font-display text-3xl sm:text-4xl">
        {kind === "income" ? "Record income" : kind === "transfer" ? "Cash to bank" : "Record an expense"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">One question at a time. Confirm, then post. Every line is a balanced voucher.</p>
      <div className="mt-5">
        <BooksCapture defaultKind={kind} defaultMode={via} visionOn={isVisionConfigured()} />
      </div>
    </div>
  );
}
