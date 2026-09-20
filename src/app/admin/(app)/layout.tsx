import { signOut } from "@/auth";
import { AdminHeader, AdminTabBar, type AdminTab } from "@/components/admin/AdminChrome";
import { PwaRegister } from "@/components/admin/PwaRegister";
import { currentRole, requireAdmin } from "@/lib/admin";
import { getRuntimeFarm } from "@/lib/profile";

export const dynamic = "force-dynamic";

function tabsFor(role: "operator" | "staff" | null): AdminTab[] {
  const tabs: AdminTab[] = [
    { href: "/admin", label: "Home", icon: "home" },
    { href: "/admin/map", label: "Map", icon: "map" },
    { href: "/admin/log", label: "Log", icon: "log" },
  ];
  if (role !== "staff") {
    tabs.push({ href: "/admin/books", label: "Books", icon: "books" });
  }
  tabs.push({ href: "/admin/more", label: "More", icon: "more" });
  return tabs;
}

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const role = await currentRole();
  const runtime = await getRuntimeFarm();

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
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-paper text-ink">
        {children}
      </div>
      <AdminTabBar tabs={tabsFor(role)} />
    </div>
  );
}
