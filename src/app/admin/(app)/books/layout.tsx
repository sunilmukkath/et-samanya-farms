import { requireOperator } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function BooksLayout({ children }: { children: React.ReactNode }) {
  await requireOperator("books");
  return children;
}
