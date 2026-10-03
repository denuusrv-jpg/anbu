import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { Invalid, validateAnswers } from "@/lib/onboardingValidation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 10000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Anfrage zu groß." }, { status: 400 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  let answers;
  try {
    ({ answers } = validateAnswers(parsed));
  } catch (error) {
    if (error instanceof Invalid) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  // Test-Durchlauf aus dem Admin-Bereich: nur prüfen, nichts speichern
  if (parsed?.test === true) {
    const store = await cookies();
    if (verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.json({ ok: true, stored: false, test: true });
    }
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  }

  // Solange Supabase nicht verbunden ist, wird nur geprüft (Vorschau-Modus)
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  // Der Nutzer schreibt mit seiner eigenen Sitzung - die RLS-Regeln erlauben nur die eigene Zeile.
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      region: answers.region,
      city: answers.city ?? null,
      interests: answers.interests,
      vibes: answers.vibes,
      mode: answers.mode,
      profile: answers.profile ?? null,
      extras: answers.extras ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }

  // Wartelisten-Eintrag als "onboarded" markieren (nicht kritisch, daher ohne Fehlerabbruch)
  if (user.email && isServiceRoleConfigured()) {
    await getServiceClient()
      .from("waitlist")
      .update({ status: "onboarded" })
      .eq("email", user.email.toLowerCase());
  }

  return NextResponse.json({ ok: true, stored: true });
}
