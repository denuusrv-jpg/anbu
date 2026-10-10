import { NextResponse } from "next/server";
import { recordConsent } from "@/lib/consent";
import { logError } from "@/lib/errorLog";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Zustimmung zur Datenschutzerklärung festhalten (für Konten, die sie noch nicht gegeben haben)
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Bitte bestätige zuerst die Datenschutzbestimmungen." }, { status: 400 });
  }
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });

  try {
    if (!(await recordConsent(data.user.id))) throw new Error("consent failed");
  } catch (error) {
    await logError(error, "API /api/consent");
    return NextResponse.json({ error: "Das hat leider nicht geklappt. Bitte versuch es noch einmal." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
