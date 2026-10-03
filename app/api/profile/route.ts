import { NextResponse } from "next/server";
import { GENDERS, GROUP_SIZES, INTERESTS, MATCH_GENDERS, TRACKS, VIBES, VISIBILITIES } from "@/lib/onboarding";
import { MAX_FOLLOW_UPS } from "@/lib/onboarding";
import { Invalid, choice, followUps, idOrCustom, oneOf, validateBusiness, validateTranscript } from "@/lib/onboardingValidation";
import { saveTranscript } from "@/lib/profileStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errorLog";

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
    .select("track, mode, profile, business, visibility, extras, deleted_at")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!row || row.deleted_at) {
    return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  let transcript: ReturnType<typeof validateTranscript> = [];
  try {
    if (body.interests !== undefined) update.interests = choice(body.interests, INTERESTS, "Interessen", 1);
    if (body.vibes !== undefined) update.vibes = choice(body.vibes, VIBES, "Vibe", 1);

    // Gespräch fortsetzen: neue Fragen und Antworten werden an die bisherigen angehängt,
    // der Chatverlauf wird pro Konto abgelegt (für die Person selbst unsichtbar)
    if (body.talk !== undefined) {
      const talk = (body.talk && typeof body.talk === "object" ? body.talk : {}) as {
        followUps?: unknown;
        transcript?: unknown;
      };
      const added = followUps(talk.followUps) ?? [];
      if (added.length > 0) {
        const extras = (update.extras ?? row.extras ?? {}) as { followUps?: unknown[] };
        const merged = [...(extras.followUps ?? []), ...added].slice(-MAX_FOLLOW_UPS);
        update.extras = { ...extras, followUps: merged };
      }
      transcript = validateTranscript(talk.transcript);
    }

    // Eine Angabe aus dem Steckbrief entfernen (Dashboard: ×)
    if (body.removeFact !== undefined) {
      const fact = (body.removeFact && typeof body.removeFact === "object" ? body.removeFact : {}) as {
        kind?: unknown;
        question?: unknown;
        answer?: unknown;
      };
      if ((fact.kind !== "free" && fact.kind !== "follow") || typeof fact.answer !== "string") {
        throw new Invalid("Angabe ist ungültig.");
      }
      const extras = { ...((update.extras ?? row.extras ?? {}) as Record<string, unknown>) };
      if (fact.kind === "free") {
        if (extras.freeText === fact.answer) delete extras.freeText;
      } else {
        const list = ((extras.followUps ?? []) as { question: string; answer: string }[]).slice();
        const index = list.findIndex((f) => f.question === fact.question && f.answer === fact.answer);
        if (index >= 0) list.splice(index, 1);
        extras.followUps = list;
      }
      update.extras = extras;
    }

    if (body.gender !== undefined) update.gender = idOrCustom(body.gender, GENDERS, "Geschlecht", true);
    if (body.matchGender !== undefined) update.match_gender = oneOf(body.matchGender, MATCH_GENDERS, "Wunsch", true);

    if (body.groupSize !== undefined) {
      update.group_size = oneOf(body.groupSize, GROUP_SIZES, "Gruppengröße", true);
    }

    // Modus-Switch: Privat / Community <-> Business & Co-Founding
    if (body.track !== undefined) {
      const track = oneOf(body.track, TRACKS, "Modus", true);
      if (track === "business") {
        // Business-Profile haben immer einen Namen, also braucht es ein angelegtes Profil
        if (!row.profile) throw new Invalid("Lege zuerst ein Profil an (Chat erneut durchspielen).");
        const business = body.business !== undefined ? validateBusiness(body.business) : row.business;
        if (!business) throw new Invalid("Bitte ergänze zuerst deine Business-Angaben.");
        update.track = "business";
        update.mode = "profile";
        update.business = business;
      } else {
        update.track = "community";
        // "Nur für Business-Profile sichtbar" gibt es nur im Business-Modus; die Angaben bleiben gespeichert
        if (row.visibility === "business") update.visibility = "stealth";
      }
    }

    if (body.business !== undefined && body.track === undefined) {
      if (row.track !== "business") throw new Invalid("Du hast kein Business-Profil.");
      update.business = validateBusiness(body.business);
    }

    if (body.mode !== undefined) {
      if (body.mode !== "anonymous" && body.mode !== "profile") throw new Invalid("Modus ist ungültig.");
      if (body.mode === "anonymous" && (update.track ?? row.track) === "business") {
        throw new Invalid("Business-Profile können nicht anonym sein.");
      }
      if (body.mode === "profile" && !row.profile) {
        throw new Invalid("Lege zuerst ein Profil an (Chat erneut durchspielen).");
      }
      update.mode = body.mode;
    }

    if (body.visibility !== undefined) {
      const visibility = oneOf(body.visibility, VISIBILITIES, "Sichtbarkeit", true);
      if (visibility === "business" && (update.track ?? row.track) !== "business") {
        throw new Invalid("Diese Sichtbarkeit ist nur für Business-Profile möglich.");
      }
      update.visibility = visibility;
    }

  } catch (error) {
    if (error instanceof Invalid) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  if (Object.keys(update).length === 0 && transcript.length === 0) {
    return NextResponse.json({ error: "Nichts zu ändern." }, { status: 400 });
  }

  await saveTranscript(data.user.id, transcript);
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("user_profiles").update(update).eq("user_id", data.user.id);
  if (error) {
    await logError(error, "API /api/profile (Speichern)");
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
