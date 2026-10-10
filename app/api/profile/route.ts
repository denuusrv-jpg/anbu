import { NextResponse } from "next/server";
import {
  ALL_HUBS,
  GENDERS,
  GROUP_SIZES,
  INTERESTS,
  LANGUAGES,
  MATCH_GENDERS,
  MAX_AGE,
  CUSTOM_PATTERN,
  MAX_HOBBIES,
  MAX_HUBS,
  NAME_PATTERN,
  MAX_INTERESTS,
  MAX_VIBES,
  MEET_FREQUENCIES,
  MEET_MODES,
  MIN_AGE,
  MIN_INTERESTS,
  PHASES,
  TRACKS,
  TRAVEL_OPTIONS,
  VIBES,
  VISIBILITIES,
} from "@/lib/onboarding";
import { conceptsWithAi } from "@/lib/conceptAi";
import { scheduleEvaluation } from "@/lib/evaluate";
import { MAX_FOLLOW_UPS } from "@/lib/onboarding";
import { Invalid, choice, followUps, idOrCustom, oneOf, stringOf, validateBusiness, validateTranscript } from "@/lib/onboardingValidation";
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
    if (body.interests !== undefined) {
      const interests = choice(body.interests, INTERESTS, "Interessen", MIN_INTERESTS, MAX_INTERESTS);
      update.interests = interests;
      update.interest_concepts = await conceptsWithAi(interests, "interest");
    }
    if (body.vibes !== undefined) {
      const vibes = choice(body.vibes, VIBES, "Vibe", 1, MAX_VIBES);
      update.vibes = vibes;
      update.vibe_concepts = await conceptsWithAi(vibes, "vibe");
    }

    // Angaben aus Phase 1 anpassen (Alter, Altersspanne, Art der Freundschaft, Entfernung, Ort, Sprachen, Lebensphase, Häufigkeit)
    const intField = (value: unknown, field: string) => {
      if (typeof value !== "number" || !Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) {
        throw new Invalid(`${field} muss zwischen ${MIN_AGE} und ${MAX_AGE} liegen.`);
      }
      return value;
    };
    // Profilbild vorhanden oder entfernt (das Bild selbst lädt der Browser in den eigenen Ordner)
    if (body.avatar !== undefined) {
      if (typeof body.avatar !== "boolean") throw new Invalid("Profilbild ist ungültig.");
      update.has_avatar = body.avatar;
    }
    // Angaben der Profilseite: Spitzname, Vorname, Nachname, Text über mich, Hobbys
    if (body.profileInfo !== undefined) {
      const info = (body.profileInfo && typeof body.profileInfo === "object" ? body.profileInfo : {}) as Record<string, unknown>;
      const current = ((row.profile ?? {}) as Record<string, unknown>) || {};
      const next: Record<string, unknown> = { ...current, hobbies: current.hobbies ?? [], languages: current.languages ?? { ids: [], custom: [] }, photoCount: 0 };
      if (info.displayName !== undefined) {
        const name = stringOf(info.displayName, "Spitzname", 24, true) as string;
        if (!NAME_PATTERN.test(name)) throw new Invalid("Spitzname: 2 bis 24 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.");
        next.displayName = name;
      }
      const real = (value: unknown, label: string) => {
        const t = stringOf(value, label, 40);
        if (t && !NAME_PATTERN.test(t.slice(0, 24))) throw new Invalid(`${label} ist ungültig.`);
        return t || undefined;
      };
      if (info.firstName !== undefined) next.firstName = real(info.firstName, "Vorname");
      if (info.lastName !== undefined) next.lastName = real(info.lastName, "Nachname");
      if (info.bio !== undefined) next.bio = stringOf(info.bio, "Text über dich", 300) || undefined;
      if (info.hobbies !== undefined) {
        if (!Array.isArray(info.hobbies) || info.hobbies.length > MAX_HOBBIES) throw new Invalid("Hobbys sind ungültig.");
        next.hobbies = Array.from(new Set((info.hobbies as unknown[]).map((h) => {
          if (typeof h !== "string" || !CUSTOM_PATTERN.test(h.trim())) throw new Invalid("Hobbys sind ungültig.");
          return h.trim();
        })));
      }
      if (!next.displayName) throw new Invalid("Bitte gib einen Spitznamen an.");
      update.profile = next;
      update.mode = "profile";
    }
    if (body.language !== undefined) {
      if (body.language !== "de" && body.language !== "ta" && body.language !== "en") throw new Invalid("Sprache ist ungültig.");
      update.ui_language = body.language;
    }
    if (body.notifyMatches !== undefined) {
      if (typeof body.notifyMatches !== "boolean") throw new Invalid("Einstellung ist ungültig.");
      update.notify_matches = body.notifyMatches;
    }
    if (body.age !== undefined) update.age = intField(body.age, "Alter");
    if (body.ageMin !== undefined) update.age_min = intField(body.ageMin, "Altersspanne (von)");
    if (body.ageMax !== undefined) update.age_max = intField(body.ageMax, "Altersspanne (bis)");
    if (body.ageMin !== undefined && body.ageMax !== undefined && (body.ageMin as number) > (body.ageMax as number)) {
      throw new Invalid("Altersspanne: „von“ darf nicht größer sein als „bis“.");
    }
    if (body.meetMode !== undefined) {
      update.meet_mode = oneOf(body.meetMode, MEET_MODES, "Art der Freundschaft", true);
      if (update.meet_mode === "online") {
        update.region = "online";
        update.travel_minutes = null;
      }
    }
    if (body.travelMinutes !== undefined) {
      if (body.travelMinutes === null || body.travelMinutes === 0) update.travel_minutes = null;
      else if (typeof body.travelMinutes === "number" && TRAVEL_OPTIONS.some((o) => o.minutes === body.travelMinutes)) update.travel_minutes = body.travelMinutes;
      else throw new Invalid("Entfernung ist ungültig.");
    }
    if (body.place !== undefined) {
      const p = (body.place && typeof body.place === "object" ? body.place : {}) as { name?: unknown; lat?: unknown; lng?: unknown; hub?: unknown };
      if (typeof p.name !== "string" || p.name.trim().length < 2 || p.name.length > 60) throw new Invalid("Ort ist ungültig.");
      if (typeof p.lat !== "number" || typeof p.lng !== "number" || p.lat < 45 || p.lat > 56 || p.lng < 5 || p.lng > 18) throw new Invalid("Ort ist ungültig.");
      if (typeof p.hub !== "string" || !ALL_HUBS.some((h) => h.id === p.hub)) throw new Invalid("Hub ist ungültig.");
      update.city = p.name.trim();
      update.lat = Math.round(p.lat * 100) / 100;
      update.lng = Math.round(p.lng * 100) / 100;
      update.region = p.hub;
    }
    if (body.languages !== undefined) update.languages = choice(body.languages, LANGUAGES, "Sprachen", 1, 5);
    if (body.lifePhase !== undefined) update.life_phase = idOrCustom(body.lifePhase, PHASES, "Lebensphase", true);
    if (body.meetFrequency !== undefined) update.meet_frequency = oneOf(body.meetFrequency, MEET_FREQUENCIES, "Treffhäufigkeit", true);

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

    // Eine Angabe aus dem Steckbrief entfernen (Profil: ×)
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

    // Hubs ändern (höchstens zwei): der erste ist region, der zweite second_region
    if (body.hubs !== undefined) {
      const hubs = choice(body.hubs, ALL_HUBS, "Hubs", 1);
      const list = [...hubs.ids, ...hubs.custom];
      if (list.length > MAX_HUBS) throw new Invalid(`Bitte höchstens ${MAX_HUBS} Hubs.`);
      update.region = list[0];
      update.second_region = list[1] ?? null;
      // Der Grund für zwei Hubs gilt nur bei zwei Hubs
      if (list.length < 2) {
        const extras = { ...((update.extras ?? row.extras ?? {}) as Record<string, unknown>) };
        delete extras.hubReason;
        update.extras = extras;
      }
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
  // Neue Antworten aus dem Gespräch: im Hintergrund auswerten (Werte-Tags, No-Gos)
  if (body.talk !== undefined) scheduleEvaluation(data.user.id);
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("user_profiles").update(update).eq("user_id", data.user.id);
  if (error) {
    await logError(error, "API /api/profile (Speichern)");
    return NextResponse.json({ error: "Speichern hat nicht geklappt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
