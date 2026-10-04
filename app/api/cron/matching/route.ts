import { NextResponse } from "next/server";
import { runMatching } from "@/lib/matchingRun";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Täglicher Matching-Lauf (siehe vercel.json): bildet neue Matches, aber nur in Hubs, die die Schwelle erreicht haben.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET ist nicht gesetzt." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  const result = await runMatching(getServiceClient(), { apply: true, force: false });
  return NextResponse.json({ ok: true, created: result.created, skipped: result.skipped.length, openHubs: result.openHubs });
}
