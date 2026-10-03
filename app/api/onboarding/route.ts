import { NextResponse } from "next/server";
import {
  ALIAS_PATTERN,
  INTERESTS,
  MAX_INTERESTS,
  PROFILE_MODES,
  REGIONS,
  VIBES,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 4000;

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return bad("Anfrage zu groß.");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("Ungültige Anfrage.");
  }

  const regionIds: string[] = REGIONS.map((r) => r.id);
  const interestIds: string[] = INTERESTS.map((i) => i.id);
  const vibeIds: string[] = VIBES.map((v) => v.id);

  if (typeof body.region !== "string" || !regionIds.includes(body.region)) {
    return bad("Region fehlt oder ist ungültig.");
  }
  if (
    body.city !== undefined &&
    (typeof body.city !== "string" || body.city.trim().length > 60)
  ) {
    return bad("Stadt ist ungültig.");
  }
  if (
    !Array.isArray(body.interests) ||
    body.interests.length < 1 ||
    body.interests.length > MAX_INTERESTS ||
    !body.interests.every((i) => typeof i === "string" && interestIds.includes(i))
  ) {
    return bad("Interessen sind ungültig.");
  }
  if (typeof body.vibe !== "string" || !vibeIds.includes(body.vibe)) {
    return bad("Vibe fehlt oder ist ungültig.");
  }
  if (
    typeof body.mode !== "string" ||
    !(PROFILE_MODES as readonly string[]).includes(body.mode)
  ) {
    return bad("Profil-Modus ist ungültig.");
  }
  if (
    body.mode === "pseudonym" &&
    (typeof body.alias !== "string" || !ALIAS_PATTERN.test(body.alias.trim()))
  ) {
    return bad("Pseudonym ist ungültig.");
  }
  if (
    body.token !== undefined &&
    (typeof body.token !== "string" || !/^[0-9a-f-]{16,64}$/i.test(body.token))
  ) {
    return bad("Token ist ungültig.");
  }

  const answers: OnboardingAnswers = {
    region: body.region,
    city: typeof body.city === "string" ? body.city.trim() || undefined : undefined,
    interests: Array.from(new Set(body.interests as string[])),
    vibe: body.vibe,
    mode: body.mode as OnboardingAnswers["mode"],
    alias:
      body.mode === "pseudonym" ? (body.alias as string).trim() : undefined,
  };

  // TODO(Supabase): `answers` zusammen mit `body.token` in der Tabelle
  // `onboarding_answers` speichern, sobald das Projekt und die Warteliste stehen.
  void answers;

  return NextResponse.json({ ok: true });
}
