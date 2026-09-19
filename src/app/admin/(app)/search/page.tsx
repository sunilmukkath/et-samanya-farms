import { AskFarm } from "@/components/admin/AskFarm";
import { askFarm } from "@/lib/ask";
import { isVisionConfigured } from "@/lib/farm";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const initial = query ? await askFarm(query) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Ask the farm</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Talk or type. The knowledge bank is the notes you save.
      </p>
      <AskFarm initialQuery={query} initial={initial} visionEnabled={isVisionConfigured()} />
    </div>
  );
}
