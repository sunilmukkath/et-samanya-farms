import { signOut } from "@/auth";
import { AdminHeader, AdminTabBar, type AdminTab } from "@/components/admin/AdminChrome";
import { PwaRegister } from "@/components/admin/PwaRegister";
import { headers } from "next/headers";
import { currentRole, requireAdmin } from "@/lib/admin";
import { getRuntimeFarm } from "@/lib/profile";

export const dynamic = "force-dynamic";

const tabs: AdminTab[] = [
  { href: "/admin", label: "Home", icon: "home" },
  { href: "/admin/map", label: "Map", icon: "map" },
  { href: "/admin/log", label: "Log", icon: "log" },
  { href: "/admin/more", label: "More", icon: "more" },
];

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const role = await currentRole();
  const runtime = await getRuntimeFarm();
  const path = (await headers()).get("x-pathname") ?? "";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="admin-app flex h-dvh flex-col overflow-hidden bg-leaf-deep text-cream">
      <AdminHeader
        farmName={runtime.shortName}
        roleLabel={role === "staff" ? "Staff" : null}
        signOut={signOutAction}
      />
      <PwaRegister />
      <div
        className={`relative flex min-h-0 flex-1 flex-col bg-paper text-ink ${
          path.startsWith("/admin/map") ? "overflow-hidden" : "overflow-y-auto overscroll-y-contain"
        }`}
      >
        {children}
      </div>
      <AdminTabBar tabs={tabs} />
    </div>
  );
}
