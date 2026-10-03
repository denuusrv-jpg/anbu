import { NextResponse } from "next/server";
import { WISHES_MAX } from "@/lib/onboarding";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errorLog";

export const dynamic = "force-dynamic";

const MAX_PER_DAY = 10;

// Eine weitere Idee oder einen Wunsch für DSpora einreichen (aus dem Hub).
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  let body: { wish?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const wish = typeof body.wish === "string" ? body.wish.trim() : "";
  if (wish.length < 3 || wish.length > WISHES_MAX) {
    return NextResponse.json({ error: `Bitte 3 bis ${WISHES_MAX} Zeichen.` }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("user_wishes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", data.user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_DAY) {
    return NextResponse.json({ error: "Das waren heute schon viele Ideen. Danke, bis morgen!" }, { status: 429 });
  }

  const { error } = await supabase.from("user_wishes").insert({ user_id: data.user.id, wish });
  if (error) {
    await logError(error, "API /api/wishes (Speichern)");
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
