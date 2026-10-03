import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEmail, looksLikeBot, rateLimited } from "@/lib/botGuard";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function siteOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const ok = NextResponse.json({ ok: true });

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

  // Bot-Schutz: Honeypot-Feld und Zeit-Check -> stille "Erfolg"-Antwort, es wird nichts gespeichert
  if (looksLikeBot(body)) return ok;

  if (rateLimited(request, "waitlist")) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte warte einen Moment." }, { status: 429 });
  }

  // Ohne Supabase gibt es nichts zu speichern (Vorschau-Modus)
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) return ok;

  // Eintrag mit einmaligem Krypto-Token. Doppelte E-Mails werden still ignoriert,
  // damit niemand herausfinden kann, wer schon dabei ist.
  const { error } = await getServiceClient()
    .from("waitlist")
    .insert({ email, token: crypto.randomUUID(), status: "pending" });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Das hat leider nicht geklappt." }, { status: 500 });
  }

  // Magic-Link zum Onboarding verschicken (Fehler hier verhindern die Anmeldung nicht)
  try {
    const anon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await anon.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteOrigin(request)}/auth/confirm?next=/onboarding`,
      },
    });
  } catch {
    // ignorieren
  }

  return ok;
}
