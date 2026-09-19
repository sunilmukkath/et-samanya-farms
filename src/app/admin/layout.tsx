import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Farm log",
  robots: { index: false, follow: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Farm log",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8efd4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
