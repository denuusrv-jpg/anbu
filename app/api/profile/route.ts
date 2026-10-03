import { NextResponse } from "next/server";
import { GROUP_SIZES, INTERESTS, VIBES, VISIBILITIES } from "@/lib/onboarding";
import { Invalid, choice, oneOf, validateBusiness } from "@/lib/onboardingValidation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Profil im Hub anpassen: Interessen, Vibes, Anonymitäts-Schalter, Sichtbarkeit und Business-Angaben.
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

  const { data: row } = await supabase
    .from("user_profiles")
    .select("track, mode, profile, deleted_at")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!row || row.deleted_at) {
    return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  try {
    if (body.interests !== undefined) update.interests = choice(body.interests, INTERESTS, "Interessen", 1);
    if (body.vibes !== undefined) update.vibes = choice(body.vibes, VIBES, "Vibe", 1);

    if (body.groupSize !== undefined) {
      update.group_size = oneOf(body.groupSize, GROUP_SIZES, "Gruppengröße", true);
    }

    if (body.mode !== undefined) {
      if (body.mode !== "anonymous" && body.mode !== "profile") throw new Invalid("Modus ist ungültig.");
      if (body.mode === "anonymous" && row.track === "business") {
        throw new Invalid("Business-Profile können nicht anonym sein.");
      }
      if (body.mode === "profile" && !row.profile) {
        throw new Invalid("Lege zuerst ein Profil an (Chat erneut durchspielen).");
      }
      update.mode = body.mode;
    }

    if (body.visibility !== undefined) {
      const visibility = oneOf(body.visibility, VISIBILITIES, "Sichtbarkeit", true);
      if (visibility === "business" && row.track !== "business") {
        throw new Invalid("Diese Sichtbarkeit ist nur für Business-Profile möglich.");
      }
      update.visibility = visibility;
    }

    if (body.business !== undefined) {
      if (row.track !== "business") throw new Invalid("Du hast kein Business-Profil.");
      update.business = validateBusiness(body.business);
    }
  } catch (error) {
    if (error instanceof Invalid) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nichts zu ändern." }, { status: 400 });
  }

  const { error } = await supabase.from("user_profiles").update(update).eq("user_id", data.user.id);
  if (error) return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
