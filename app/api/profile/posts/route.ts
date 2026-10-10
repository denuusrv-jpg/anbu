import { NextResponse } from "next/server";
import { CAPTION_MAX, MAX_POSTS, MAX_SLIDES, slidesExist } from "@/lib/profileMedia";
import { isUuid } from "@/lib/chatApi";
import { logError } from "@/lib/errorLog";
import { sanitizeText } from "@/lib/sanitize";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Beitrag veröffentlichen: Die Bilder (Slides 1..n) hat der Browser vorher hochgeladen. Hier wird geprüft, dass sie wirklich
// da sind, dass höchstens 6 Beiträge mit je höchstens 6 Slides existieren, und der Beitrag wird eingetragen.
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const slides = typeof body.slides === "number" ? body.slides : 0;
  if (!isUuid(id) || !Number.isInteger(slides) || slides < 1 || slides > MAX_SLIDES) {
    return NextResponse.json({ error: `Ein Beitrag hat 1 bis ${MAX_SLIDES} Bilder.` }, { status: 400 });
  }
  const caption = typeof body.caption === "string" ? sanitizeText(body.caption.trim()).slice(0, CAPTION_MAX) : "";

  const db = getServiceClient();
  try {
    const { count } = await db.from("profile_posts").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id);
    if ((count ?? 0) >= MAX_POSTS) return NextResponse.json({ error: `Du kannst höchstens ${MAX_POSTS} Beiträge haben. Lösche zuerst einen.` }, { status: 409 });
    if (!(await slidesExist(db, auth.user.id, id, slides))) return NextResponse.json({ error: "Die Bilder sind nicht vollständig angekommen. Bitte versuch es noch einmal." }, { status: 400 });
    const { error } = await db.from("profile_posts").insert({ id, user_id: auth.user.id, caption: caption || null, slides });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logError(error, "API /api/profile/posts");
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
}
