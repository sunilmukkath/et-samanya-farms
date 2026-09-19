import { POST as ingest } from "@/app/api/farm/sensor/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return ingest(request);
}
