import { hardwareRecurring, samanyaHardwareKit } from "@/lib/iot/hardware";
import Link from "next/link";

const waveLabel = {
  have: "Already enough",
  first: "Buy first",
  next: "Buy next",
  skip: "Do not buy",
};

export default function HardwarePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-8">
      <h1 className="font-display text-3xl sm:text-4xl">4-acre kit</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Phones first. Then one hub and four node types for pond, soil, pump, and rain. India LoRa is 865–867 MHz.
        Capacitive soil probes only.
      </p>
      <Link href="/admin/nodes" className="tap mt-4 flex items-center justify-center rounded-full bg-leaf-deep text-sm font-semibold text-cream">
        Pair a node
      </Link>

      {(["have", "first", "next", "skip"] as const).map((wave) => {
        const rows = samanyaHardwareKit.filter((item) => item.wave === wave);
        return (
          <section key={wave} className="mt-6">
            <h2 className="font-display text-2xl">{waveLabel[wave]}</h2>
            <ul className="mt-3 space-y-2">
              {rows.map((item) => (
                <li key={item.id} className="rounded-3xl border border-line bg-white px-4 py-3">
                  <p className="font-semibold">
                    {item.name}
                    <span className="ml-2 text-sm font-normal text-muted">× {item.qty}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{item.role}</p>
                  {item.kind ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {item.kind}
                      {item.metric ? ` · ${item.metric}` : ""}
                      {item.protocol ? ` · ${item.protocol}` : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-6">
        <h2 className="font-display text-2xl">Recurring</h2>
        <ul className="mt-3 space-y-2">
          {hardwareRecurring.map((row) => (
            <li key={row.name} className="rounded-3xl border border-line bg-white px-4 py-3">
              <p className="font-semibold">{row.name}</p>
              <p className="text-sm text-ink-soft">{row.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
