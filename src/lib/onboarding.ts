export type WalkStep = {
  id: string;
  title: string;
  hint: string;
  href: string;
  done: boolean;
};

export function firstWalk(opts: {
  onboarded: boolean;
  plotCount: number;
  noteCount: number;
  voucherCount: number;
  showBooks: boolean;
}): WalkStep[] {
  const steps: WalkStep[] = [
    {
      id: "setup",
      title: "Name this land",
      hint: "Farm name, what you grow, map pin",
      href: "/admin/setup",
      done: opts.onboarded,
    },
    {
      id: "plot",
      title: "Name a plot",
      hint: "A bed, pond, or tree belt you can log against",
      href: "/admin/plots",
      done: opts.plotCount > 0,
    },
    {
      id: "log",
      title: "Save a field note",
      hint: "One photo or a line, then the chips, then save",
      href: "/admin/log",
      done: opts.noteCount > 0,
    },
  ];
  if (opts.showBooks) {
    steps.push({
      id: "books",
      title: "Post the first rupee",
      hint: "Expense or income in the accounts books",
      href: "/admin/books/new",
      done: opts.voucherCount > 0,
    });
  }
  return steps;
}

export function nextWalkStep(steps: WalkStep[]) {
  return steps.find((step) => !step.done) ?? null;
}
