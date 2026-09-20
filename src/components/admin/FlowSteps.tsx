export function FlowSteps({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        <span className="min-w-0 truncate">{label ?? `Step ${safeCurrent} of ${safeTotal}`}</span>
        <span className="shrink-0">
          {safeCurrent}/{safeTotal}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
        <div
          className="h-full bg-leaf-deep transition-[width] duration-200"
          style={{ width: `${(safeCurrent / safeTotal) * 100}%` }}
        />
      </div>
    </div>
  );
}
