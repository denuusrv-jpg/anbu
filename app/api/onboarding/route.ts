import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { Invalid, validateAnswers, validateTranscript } from "@/lib/onboardingValidation";
import { saveProfile } from "@/lib/profileStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 400000; // Antworten plus Chatverlauf

// Speichern der Antworten für einen bereits angemeldeten Nutzer.
// (Gäste schicken ihre Antworten über /api/auth/magic-link, sie werden nach der Anmeldung übernommen.)
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
  let transcript;
  try {
    ({ answers } = validateAnswers(parsed));
    transcript = validateTranscript(parsed.transcript);
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
  if (!data.user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  if (!(await saveProfile(supabase, data.user, answers, transcript))) {
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
