import "server-only";
import {
  CUSTOM_PATTERN,
  FOLLOW_UP_ANSWER_MAX,
  FREE_TEXT_MAX,
  INTERESTS,
  LANGUAGES,
  MAX_AGE,
  MAX_CHOICES,
  MAX_CUSTOM,
  MAX_HOBBIES,
  MAX_PHOTOS,
  MIN_AGE,
  NAME_PATTERN,
  PHASES,
  PROFILE_MODES,
  REGIONS,
  VIBES,
  VISIBILITIES,
  WISHES_MAX,
  type Choice,
  type FollowUp,
  type OnboardingAnswers,
  type Option,
  type ProfileData,
} from "@/lib/onboarding";

export class Invalid extends Error {}

function fail(message: string): never {
  throw new Invalid(message);
}

const ids = (options: Option[]) => options.map((o) => o.id);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringOf(value: unknown, field: string, maxLength: number, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} fehlt.`);
    return undefined;
  }
  if (typeof value !== "string" || value.trim().length > maxLength) {
    fail(`${field} ist ungültig.`);
  }
  return (value as string).trim();
}

export function oneOf(value: unknown, options: Option[], field: string, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} fehlt.`);
    return undefined;
  }
  if (typeof value !== "string" || !ids(options).includes(value)) {
    fail(`${field} ist ungültig.`);
  }
  return value as string;
}

/** Eine Id aus der Liste ODER ein eigener, kurzer Text (z. B. eigene Region). */
export function idOrCustom(value: unknown, options: Option[], field: string, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} fehlt.`);
    return undefined;
  }
  if (typeof value !== "string") fail(`${field} ist ungültig.`);
  const text = (value as string).trim();
  if (ids(options).includes(text)) return text;
  if (!CUSTOM_PATTERN.test(text)) fail(`${field} ist ungültig.`);
  return text;
}

export function manyOf(value: unknown, options: Option[], field: string, max = MAX_CHOICES) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max) fail(`${field} ist ungültig.`);
  const allowed = ids(options);
  const list = value as unknown[];
  if (!list.every((v) => typeof v === "string" && allowed.includes(v))) {
    fail(`${field} ist ungültig.`);
  }
  return Array.from(new Set(list as string[]));
}

export function choice(value: unknown, options: Option[], field: string, minTotal: number): Choice {
  if (!isObject(value)) fail(`${field} ist ungültig.`);
  const idList = manyOf((value as Record<string, unknown>).ids, options, field);
  const customRaw = (value as Record<string, unknown>).custom ?? [];
  if (!Array.isArray(customRaw) || customRaw.length > MAX_CUSTOM) {
    fail(`${field} ist ungültig.`);
  }
  const custom = Array.from(
    new Set(
      (customRaw as unknown[]).map((c) => {
        if (typeof c !== "string" || !CUSTOM_PATTERN.test(c.trim())) {
          fail(`${field}: Eigener Eintrag ist ungültig.`);
        }
        return (c as string).trim();
      }),
    ),
  );
  if (idList.length + custom.length < minTotal) fail(`${field}: Bitte wähle etwas aus.`);
  if (idList.length + custom.length > MAX_CHOICES) fail(`${field}: Zu viele Einträge.`);
  return { ids: idList, custom };
}

function profile(value: unknown): ProfileData {
  if (!isObject(value)) fail("Profil fehlt.");
  const p = value as Record<string, unknown>;

  const displayName = stringOf(p.displayName, "Anzeigename", 24, true) as string;
  if (!NAME_PATTERN.test(displayName)) fail("Anzeigename ist ungültig.");

  let age: number | undefined;
  if (p.age !== undefined && p.age !== null && p.age !== "") {
    if (
      typeof p.age !== "number" ||
      !Number.isInteger(p.age) ||
      p.age < MIN_AGE ||
      p.age > MAX_AGE
    ) {
      fail(`Alter muss zwischen ${MIN_AGE} und ${MAX_AGE} liegen.`);
    }
    age = p.age;
  }

  let hobbies: string[] = [];
  if (p.hobbies !== undefined) {
    if (!Array.isArray(p.hobbies) || p.hobbies.length > MAX_HOBBIES) fail("Hobbys sind ungültig.");
    hobbies = Array.from(
      new Set(
        (p.hobbies as unknown[]).map((h) => {
          if (typeof h !== "string" || !CUSTOM_PATTERN.test(h.trim())) fail("Hobbys sind ungültig.");
          return (h as string).trim();
        }),
      ),
    );
  }

  const photoCount = p.photoCount ?? 0;
  if (
    typeof photoCount !== "number" ||
    !Number.isInteger(photoCount) ||
    photoCount < 0 ||
    photoCount > MAX_PHOTOS
  ) {
    fail("Fotos sind ungültig.");
  }

  return {
    displayName,
    age,
    hobbies,
    languages: choice(p.languages ?? { ids: [], custom: [] }, LANGUAGES, "Sprachen", 0),
    phase: idOrCustom(p.phase, PHASES, "Lebensphase"),
    funFact: stringOf(p.funFact, "Fun Fact", 100),
    askMeAbout: stringOf(p.askMeAbout, "Frag mich nach", 60),
    visibility: oneOf(p.visibility, VISIBILITIES, "Sichtbarkeit", true) as string,
    photoCount: photoCount as number,
  };
}

function followUps(value: unknown): FollowUp[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 2) fail("Folgefragen sind ungültig.");
  return (value as unknown[]).map((item) => {
    if (!isObject(item)) fail("Folgefragen sind ungültig.");
    const question = stringOf(item.question, "Folgefrage", 300, true) as string;
    const answer = stringOf(item.answer, "Antwort", FOLLOW_UP_ANSWER_MAX, true) as string;
    return { question, answer };
  });
}

export function validateAnswers(body: unknown): { answers: OnboardingAnswers; token?: string } {
  if (!isObject(body)) fail("Ungültige Anfrage.");
  const b = body as Record<string, unknown>;

  const mode = b.mode;
  if (typeof mode !== "string" || !(PROFILE_MODES as readonly string[]).includes(mode)) {
    fail("Profil-Modus ist ungültig.");
  }

  let token: string | undefined;
  if (b.token !== undefined) {
    if (typeof b.token !== "string" || !/^[0-9a-f-]{16,64}$/i.test(b.token)) {
      fail("Token ist ungültig.");
    }
    token = b.token as string;
  }

  let extras: OnboardingAnswers["extras"];
  if (b.extras !== undefined && b.extras !== null) {
    if (!isObject(b.extras)) fail("Zusatzangaben sind ungültig.");
    const e = b.extras as Record<string, unknown>;
    extras = {
      freeText: stringOf(e.freeText, "Freitext", FREE_TEXT_MAX),
      followUps: followUps(e.followUps),
      wishes: stringOf(e.wishes, "Wünsche", WISHES_MAX),
    };
  }

  const answers: OnboardingAnswers = {
    region: idOrCustom(b.region, REGIONS, "Region", true) as string,
    city: stringOf(b.city, "Stadt", 60),
    interests: choice(b.interests, INTERESTS, "Interessen", 1),
    vibes: choice(b.vibes, VIBES, "Vibe", 1),
    mode: mode as OnboardingAnswers["mode"],
    profile: mode === "profile" ? profile(b.profile) : undefined,
    extras,
  };
  return { answers, token };
}
