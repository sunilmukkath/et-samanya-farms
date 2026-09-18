const farmOperators = ["sunilmukkath@elastictree.com", "tony@elastictree.com"];

function extraAdminEmails() {
  const fromList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const single = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return single ? [...fromList, single] : fromList;
}

export function adminEmails() {
  return [...new Set([...farmOperators, ...extraAdminEmails()])];
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
