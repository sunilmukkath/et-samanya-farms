import { requireOperator } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  await requireOperator();
  return children;
}
