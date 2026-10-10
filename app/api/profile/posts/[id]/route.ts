import { NextResponse } from "next/server";
import { isUuid } from "@/lib/chatApi";
import { logError } from "@/lib/errorLog";
import { removePostFiles } from "@/lib/profileMedia";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Eigenen Beitrag löschen (Eintrag und alle Bilder)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Beitrag nicht gefunden." }, { status: 404 });
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  const db = getServiceClient();
  try {
    const { data } = await db.from("profile_posts").select("id, slides").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Beitrag nicht gefunden." }, { status: 404 });
    await removePostFiles(db, auth.user.id, id, (data as { slides: number }).slides);
    await db.from("profile_posts").delete().eq("id", id).eq("user_id", auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logError(error, "API /api/profile/posts/[id]");
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
}
