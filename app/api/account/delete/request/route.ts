import { NextResponse } from "next/server";
import { sendDeleteMail } from "@/lib/accountDelete";
import { rateLimited } from "@/lib/botGuard";
import { logError } from "@/lib/errorLog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Schritt 1 zum Löschen: schickt einen Bestätigungslink an die E-Mail-Adresse des Kontos. Gelöscht wird noch nichts.
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  if (rateLimited(request, "delete-request", 3)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz und versuch es dann erneut." }, { status: 429 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });

  try {
    const { data: row } = await supabase.from("user_profiles").select("ui_language").eq("user_id", user.id).maybeSingle();
    const sent = await sendDeleteMail(user.email, user.id, row?.ui_language as string | null);
    if (!sent) return NextResponse.json({ error: "Der Mail-Versand ist noch nicht eingerichtet." }, { status: 503 });
  } catch (error) {
    await logError(error, "API /api/account/delete/request");
    return NextResponse.json({ error: "Die Mail konnte nicht gesendet werden. Bitte versuch es noch einmal." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
