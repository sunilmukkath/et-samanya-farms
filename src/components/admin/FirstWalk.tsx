import { firstWalk, nextWalkStep, type WalkStep } from "@/lib/onboarding";
import Link from "next/link";

export function FirstWalk({ steps }: { steps: WalkStep[] }) {
  const next = nextWalkStep(steps);
  const done = steps.filter((step) => step.done).length;
  if (!next) return null;

  return (
    <section className="mb-5 rounded-[1.75rem] border border-line bg-white px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Get started · {done + 1} of {steps.length}
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight">{next.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{next.hint}</p>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done ? "bg-leaf-deep text-cream" : step.id === next.id ? "bg-leaf text-leaf-deep" : "bg-cream text-muted"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <span className={step.done ? "text-ink-soft line-through" : ""}>{step.title}</span>
          </li>
        ))}
      </ol>
      <Link href={next.href} className="tap mt-5 flex items-center justify-center rounded-full bg-leaf-deep text-base font-semibold text-cream">
        {next.title}
      </Link>
    </section>
  );
}

export { firstWalk };
