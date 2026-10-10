import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEmail, looksLikeBot, rateLimited } from "@/lib/botGuard";
import { Invalid, validateAnswers, validateTranscript } from "@/lib/onboardingValidation";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured, safeNextPath, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { logError } from "@/lib/errorLog";

export const dynamic = "force-dynamic";

function siteOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

// Magic-Link anfordern. Läuft über den Server, damit Honeypot, Zeit-Check und
// Mengenbegrenzung nicht per Direktaufruf der Supabase-Schnittstelle umgangen werden.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = cleanEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  }

  // Bots bekommen eine unauffällige "Erfolg"-Antwort, es wird aber nichts verschickt
  if (looksLikeBot(body)) return NextResponse.json({ ok: true });

  if (rateLimited(request, "magic-link")) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz und versuch es dann erneut." },
      { status: 429 },
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Die Anmeldung ist noch nicht eingerichtet." }, { status: 503 });
  }

  let next = safeNextPath(typeof body.next === "string" ? body.next : null);

  // Gast aus dem Onboarding-Chat: Antworten als Entwurf zur E-Mail-Adresse ablegen.
  // Nach der Anmeldung per Link werden sie als Profil übernommen (auch auf einem anderen Gerät).
  if (body.draft !== undefined) {
    // Wer sich über den Chat neu anmeldet, muss vorher die Datenschutzbestimmungen akzeptiert haben
    if (body.consent !== true) {
      return NextResponse.json({ error: "Bitte bestätige zuerst die Datenschutzbestimmungen." }, { status: 400 });
    }
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: "Die Anmeldung ist noch nicht eingerichtet." }, { status: 503 });
    }
    try {
      const { answers } = validateAnswers(body.draft);
      const transcript = validateTranscript(body.transcript);
      const { error: draftError } = await getServiceClient()
        .from("onboarding_drafts")
        .upsert({ email, answers, transcript, created_at: new Date().toISOString() }, { onConflict: "email" });
      if (draftError) throw new Error("draft failed");
      next = "/onboarding/save";
    } catch (error) {
      if (error instanceof Invalid) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      await logError(error, "API /api/auth/magic-link (Entwurf speichern)");
      return NextResponse.json({ error: "Das hat leider nicht geklappt. Bitte versuch es noch einmal." }, { status: 500 });
    }
  }

  const anon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteOrigin(request)}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const limited = error.code === "over_email_send_rate_limit" || error.status === 429;
    // Das Mail-Limit ist erwartbar und kein Fehler im System
    if (!limited) await logError(error, "API /api/auth/magic-link (Link senden)");
    return NextResponse.json(
      {
        error: limited
          ? "Zu viele Anfragen. Bitte warte kurz und versuch es dann erneut."
          : "Das hat leider nicht geklappt. Bitte versuch es noch einmal.",
      },
      { status: limited ? 429 : 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
