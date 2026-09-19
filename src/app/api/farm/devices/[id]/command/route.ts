import { NextResponse } from "next/server";
import { getDevice } from "@/db/queries";
import { actuationAllowed, recordActuation } from "@/lib/iot/ota";
import { hashDeviceToken } from "@/lib/iot/tokens";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const edge = process.env.FARM_EDGE_TOKEN;
  if (!edge || token !== edge) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const device = await getDevice(id);
  if (!device) return NextResponse.json({ error: "Unknown node." }, { status: 404 });
  const body = (await request.json()) as { command?: string };
  const command = body.command === "on" ? "on" : "off";
  const allowed = actuationAllowed(command, device.lastSeenAt);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 409 });
  await recordActuation(id, command);
  return NextResponse.json({
    ok: true,
    topic: `farm/${device.id}/cmd/${device.kind}`,
    command,
    maxOnMs: allowed.maxOnMs,
    tokenHint: hashDeviceToken(device.id).slice(0, 8),
  });
}
