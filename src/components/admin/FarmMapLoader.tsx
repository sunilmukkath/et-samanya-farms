"use client";

import dynamic from "next/dynamic";

export const FarmMapLoader = dynamic(
  () => import("@/components/admin/FarmMap").then((mod) => mod.FarmMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-8.6rem)] items-end bg-soil p-6 text-cream">
        Loading the farm map…
      </div>
    ),
  },
);
