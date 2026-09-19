import { NextResponse } from "next/server";
import { getDevice } from "@/db/queries";
import { otaCommand } from "@/lib/iot/ota";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const device = await getDevice(id);
  if (!device) return NextResponse.json({ error: "Unknown node." }, { status: 404 });
  const command = await otaCommand(id);
  if (!command) return NextResponse.json({ error: "No firmware for this kind." }, { status: 404 });
  return NextResponse.json(command);
}
