import { signOut } from "@/auth";
import { AdminHeader, AdminTabBar } from "@/components/admin/AdminChrome";
import { PwaRegister } from "@/components/admin/PwaRegister";
import { currentRole, requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const role = await currentRole();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-leaf-deep text-cream">
      <AdminHeader roleLabel={role === "staff" ? "Staff" : null} signOut={signOutAction} />
      <PwaRegister />
      <div className="flex min-h-0 flex-1 flex-col bg-paper text-ink">{children}</div>
      <AdminTabBar />
    </div>
  );
}
