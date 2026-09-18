import Image from "next/image";

export function BrandLockup({
  variant = "ink",
  className = "",
}: {
  variant?: "ink" | "white";
  className?: string;
}) {
  const src = variant === "white" ? "/brand/lockup-white.png" : "/brand/lockup-ink.png";
  const size = variant === "white" ? { width: 498, height: 111 } : { width: 507, height: 117 };

  return (
    <Image
      src={src}
      alt="Sāmānya Farms"
      width={size.width}
      height={size.height}
      className={`block w-auto ${className || "h-12 sm:h-14"}`}
      priority
    />
  );
}

export function Palmyra({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} fill="none" aria-hidden>
      <path d="M100 210V92" stroke="#3b2418" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M100 96c-28-8-58 8-72 28 22-8 48-4 72 16 24-20 50-24 72-16-14-20-44-36-72-28Z"
        fill="#2c4a32"
      />
      <path
        d="M100 88c-12-28-8-58 6-78 2 24 16 46 40 60-22 2-38 10-46 18Z"
        fill="#3f6b45"
      />
      <path
        d="M100 88c12-28 8-58-6-78-2 24-16 46-40 60 22 2 38 10 46 18Z"
        fill="#173022"
      />
      <path d="M78 150c8 10 14 18 22 28" stroke="#6b3e2a" strokeWidth="2" />
    </svg>
  );
}

export function FieldRows({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 360" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="800" height="360" fill="#173022" />
      <path d="M0 220c80-40 160-40 240 0s160 40 240 0 160-40 240 0 80 40 80 40V360H0V220Z" fill="#2c4a32" />
      <path d="M0 260c90-30 170-30 260 0s170 30 260 0 170-30 260 0v100H0V260Z" fill="#3f6b45" />
      <path d="M0 300c100-22 180-22 280 0s180 22 280 0 180-22 240 0v60H0V300Z" fill="#d9a441" opacity=".35" />
      <circle cx="640" cy="78" r="36" fill="#d9a441" />
      <path d="M120 210c8-28 18-54 18-54s14 24 22 54" stroke="#f4ead8" strokeWidth="3" />
      <path d="M210 200c8-34 20-64 20-64s16 28 24 64" stroke="#f4ead8" strokeWidth="3" />
      <path d="M300 208c8-30 18-58 18-58s14 26 22 58" stroke="#f4ead8" strokeWidth="3" />
    </svg>
  );
}

export function SeedBurst({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <circle cx="60" cy="60" r="56" stroke="#c45c32" strokeWidth="1.5" />
      <path d="M60 88C60 64 78 52 78 36c0-10-8-16-18-16s-18 6-18 16c0 16 18 28 18 52Z" fill="#2c4a32" />
    </svg>
  );
}
