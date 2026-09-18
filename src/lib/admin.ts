import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admins";

export { adminEmails, isAdminEmail } from "@/lib/admins";

export async function getAdminSession() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!isAdminEmail(email)) return null;
  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
