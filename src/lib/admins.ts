const farmOperators = ["sunilmukkath@elastictree.com", "tony@elastictree.com"];

function splitEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function extraAdminEmails() {
  const fromList = splitEmails(process.env.ADMIN_EMAILS);
  const single = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return single ? [...fromList, single] : fromList;
}

export function adminEmails() {
  return [...new Set([...farmOperators, ...extraAdminEmails()])];
}

export function staffEmails() {
  return [...new Set(splitEmails(process.env.STAFF_EMAILS))];
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

export function isStaffEmail(email: string | null | undefined) {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  return staffEmails().includes(value) && !isAdminEmail(value);
}

export function isFarmEmail(email: string | null | undefined) {
  return isAdminEmail(email) || isStaffEmail(email);
}

export type FarmRole = "operator" | "staff";

export function farmRole(email: string | null | undefined): FarmRole | null {
  if (isAdminEmail(email)) return "operator";
  if (isStaffEmail(email)) return "staff";
  return null;
}
