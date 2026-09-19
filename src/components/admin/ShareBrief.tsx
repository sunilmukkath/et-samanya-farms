"use client";

export function ShareBrief({ markdown }: { markdown: string }) {
  async function share() {
    const title = "ET Samanya weekly brief";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: markdown });
        return;
      }
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n\n${markdown}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="admin-no-print mt-5 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="tap rounded-full border border-line bg-white px-5 text-sm font-semibold"
      >
        Print
      </button>
      <button
        type="button"
        onClick={() => void share()}
        className="tap rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream"
      >
        Share
      </button>
    </div>
  );
}
