import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { farmRole, isFarmEmail, type FarmRole } from "@/lib/admins";

export { adminEmails, farmRole, isAdminEmail, isFarmEmail, isStaffEmail } from "@/lib/admins";
export type { FarmRole };

export async function getFarmSession() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!isFarmEmail(email)) return null;
  return session;
}

export async function getAdminSession() {
  return getFarmSession();
}

export async function requireAdmin() {
  const session = await getFarmSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireOperator(denied?: "books") {
  const session = await requireAdmin();
  if (farmRole(session.user?.email) !== "operator") {
    redirect(denied === "books" ? "/admin/more?denied=books" : "/admin");
  }
  return session;
}

export async function currentRole(): Promise<FarmRole | null> {
  const session = await getFarmSession();
  return farmRole(session?.user?.email);
}
