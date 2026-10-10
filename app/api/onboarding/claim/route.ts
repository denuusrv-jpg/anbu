import { NextResponse } from "next/server";
import { Invalid, validateAnswers, validateTranscript } from "@/lib/onboardingValidation";
import { recordConsent } from "@/lib/consent";
import { saveProfile } from "@/lib/profileStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Nach der Anmeldung per Link: übernimmt den Entwurf der verifizierten E-Mail-Adresse als Profil.
// Ein bereits vorhandenes Profil wird nie überschrieben.
export async function POST() {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ status: "exists" });

  const db = getServiceClient();
  const email = user.email.toLowerCase();
  const { data: draft } = await db
    .from("onboarding_drafts")
    .select("answers, transcript, created_at")
    .eq("email", email)
    .maybeSingle();
  if (!draft || Date.now() - new Date(draft.created_at).getTime() > DRAFT_MAX_AGE_MS) {
    return NextResponse.json({ status: "none" });
  }

  let answers;
  let transcript;
  try {
    ({ answers } = validateAnswers(draft.answers));
    transcript = validateTranscript(draft.transcript);
  } catch (error) {
    if (error instanceof Invalid) return NextResponse.json({ status: "none" });
    throw error;
  }

  if (!(await saveProfile(supabase, user, answers, transcript))) {
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }
  // Der Entwurf entsteht nur, wenn im Chat die Datenschutzbestimmungen akzeptiert wurden
  await recordConsent(user.id);
  await db.from("onboarding_drafts").delete().eq("email", email);
  return NextResponse.json({
    status: "claimed",
    photoCount: answers.profile?.photoCount ?? 0,
  });
}
