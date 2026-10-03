import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 1500; // schneller als ein Mensch tippen kann -> Bot
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  }

  // Bot-Schutz 1: Honeypot-Feld, das Menschen nie sehen und nie ausfüllen
  if (typeof body.website === "string" && body.website.length > 0) return ok;
  // Bot-Schutz 2: Zeit-Check
  if (typeof body.elapsed !== "number" || body.elapsed < MIN_FILL_MS) return ok;

  // Bremse pro Absender
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const entry = hits.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte warte einen Moment." }, { status: 429 });
  }
  hits.set(key, {
    count: entry && entry.resetAt > now ? entry.count + 1 : 1,
    resetAt: entry && entry.resetAt > now ? entry.resetAt : now + WINDOW_MS,
  });

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
