import { NextResponse } from "next/server";
import { INTERESTS, VIBES } from "@/lib/onboarding";
import { Invalid, choice } from "@/lib/onboardingValidation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Profil im Hub anpassen: Interessen, Vibes und Anonymitäts-Schalter.
export async function PATCH(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  try {
    if (body.interests !== undefined) update.interests = choice(body.interests, INTERESTS, "Interessen", 1);
    if (body.vibes !== undefined) update.vibes = choice(body.vibes, VIBES, "Vibe", 1);
    if (body.mode !== undefined) {
      if (body.mode !== "anonymous" && body.mode !== "profile") throw new Invalid("Modus ist ungültig.");
      update.mode = body.mode;
    }
  } catch (error) {
    if (error instanceof Invalid) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nichts zu ändern." }, { status: 400 });
  }

  // "Profil sichtbar" geht nur, wenn auch ein Profil angelegt wurde
  if (update.mode === "profile") {
    const { data: row } = await supabase
      .from("user_profiles")
      .select("profile")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!row?.profile) {
      return NextResponse.json(
        { error: "Lege zuerst ein Profil an (Chat erneut durchspielen)." },
        { status: 400 },
      );
    }
  }

  const { error } = await supabase.from("user_profiles").update(update).eq("user_id", data.user.id);
  if (error) return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
