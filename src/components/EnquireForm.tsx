"use client";

import { FormEvent, useState } from "react";
import { enquireInterests, site } from "@/lib/site";

export function EnquireForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const interest = String(data.get("interest") ?? "produce");
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`ET Samanya Farms — ${interest}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nInterest: ${interest}\n\n${message}`,
    );
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-line bg-cream p-6">
        <p className="font-display text-2xl text-leaf">Your note is ready to send.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          If your mail app did not open, write to{" "}
          <a className="underline decoration-clay underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          required
          name="name"
          autoComplete="name"
          className="tap w-full rounded-xl border border-line bg-paper px-3 text-base outline-none ring-leaf focus:ring-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="tap w-full rounded-xl border border-line bg-paper px-3 text-base outline-none ring-leaf focus:ring-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">I am looking for</span>
        <select
          name="interest"
          className="tap w-full rounded-xl border border-line bg-paper px-3 text-base outline-none ring-leaf focus:ring-2"
          defaultValue="produce"
        >
          {enquireInterests.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Message</span>
        <textarea
          required
          name="message"
          rows={5}
          className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-base outline-none ring-leaf focus:ring-2"
          placeholder="Quantities, dates, or when you would like to visit."
        />
      </label>
      <button
        type="submit"
        className="tap mt-2 inline-flex w-full items-center justify-center rounded-full bg-clay px-6 font-semibold text-paper hover:bg-clay-deep sm:w-auto"
      >
        Send enquiry
      </button>
    </form>
  );
}
