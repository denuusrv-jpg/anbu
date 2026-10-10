import { NextResponse } from "next/server";
import { computeProposals, savePending } from "@/lib/matchingRun";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Täglicher Matching-Lauf (siehe vercel.json): berechnet neue Vorschläge für freigegebene Hubs und legt sie als "offen" ab.
// Es entstehen KEINE Chats: Jeder Vorschlag braucht die Freigabe des Admins.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET ist nicht gesetzt." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  const db = getServiceClient();
  const result = await computeProposals(db);
  const saved = await savePending(db, result.proposals);
  return NextResponse.json({ ok: true, proposals: saved, incomplete: result.incomplete });
}
