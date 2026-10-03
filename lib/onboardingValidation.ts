import "server-only";
import {
  ACHIEVEMENT_MAX,
  CUSTOM_PATTERN,
  EXPERTISE_MAX,
  GOALS,
  GROUP_SIZES,
  HUB_REASON_MAX,
  MAX_ACHIEVEMENTS,
  MEET_FREQUENCIES,
  MAX_LINKS,
  ROLE_MAX,
  SECTORS,
  TRACKS,
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
  type BusinessData,
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

function link(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 200) fail("Link ist ungültig.");
  const text = (value as string).trim();
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    fail("Link ist ungültig.");
  }
  // Nur echte Web-Adressen (kein javascript:, data: usw.)
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) {
    fail("Link ist ungültig.");
  }
  return parsed.toString();
}

/** Business-Angaben samt Light-CV prüfen. */
export function validateBusiness(value: unknown): BusinessData {
  if (!isObject(value)) fail("Business-Angaben fehlen.");
  const b = value as Record<string, unknown>;

  const sector = idOrCustom(b.sector, SECTORS, "Branche", true) as string;
  const role = stringOf(b.role, "Rolle", ROLE_MAX, true) as string;
  if (role.length < 2) fail("Rolle ist ungültig.");
  const goals = choice(b.goals, GOALS, "Ziele", 1);
  if (goals.ids.length + goals.custom.length > 3) fail("Ziele: Bitte höchstens drei.");

  const cvRaw = isObject(b.cv) ? (b.cv as Record<string, unknown>) : {};
  const achievementsRaw = cvRaw.achievements ?? [];
  if (!Array.isArray(achievementsRaw) || achievementsRaw.length > MAX_ACHIEVEMENTS) {
    fail("Erfolge sind ungültig.");
  }
  const achievements = (achievementsRaw as unknown[])
    .map((a) => {
      if (typeof a !== "string" || a.trim().length > ACHIEVEMENT_MAX) fail("Erfolge sind ungültig.");
      return (a as string).trim();
    })
    .filter(Boolean);

  const linksRaw = cvRaw.links ?? [];
  if (!Array.isArray(linksRaw) || linksRaw.length > MAX_LINKS) fail("Links sind ungültig.");
  const links = Array.from(new Set((linksRaw as unknown[]).filter((l) => l !== "" && l != null).map(link)));

  return {
    sector,
    role,
    goals,
    cv: {
      expertise: stringOf(cvRaw.expertise, "Expertise", EXPERTISE_MAX),
      achievements,
      links,
    },
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
      hubReason: stringOf(e.hubReason, "Grund für zwei Hubs", HUB_REASON_MAX),
      meetFrequency: idOrCustom(e.meetFrequency, MEET_FREQUENCIES, "Treffhäufigkeit"),
      wishes: stringOf(e.wishes, "Wünsche", WISHES_MAX),
    };
  }

  const track = oneOf(b.track ?? "community", TRACKS, "Modus") as "community" | "business";
  // Business-Profile sind immer Profile mit Namen, nie anonym
  if (track === "business" && mode !== "profile") fail("Business-Profile können nicht anonym sein.");

  const answers: OnboardingAnswers = {
    groupSize: oneOf(b.groupSize, GROUP_SIZES, "Gruppengröße"),
    region: idOrCustom(b.region, REGIONS, "Region", true) as string,
    secondRegion: idOrCustom(b.secondRegion, REGIONS, "Zweiter Hub"),
    city: stringOf(b.city, "Stadt", 60),
    interests: choice(b.interests, INTERESTS, "Interessen", 1),
    vibes: choice(b.vibes, VIBES, "Vibe", 1),
    mode: mode as OnboardingAnswers["mode"],
    track,
    business: track === "business" ? validateBusiness(b.business) : undefined,
    profile: mode === "profile" ? profile(b.profile) : undefined,
    extras,
  };
  if (answers.secondRegion && answers.secondRegion.toLowerCase() === answers.region.toLowerCase()) {
    fail("Die beiden Hubs müssen verschieden sein.");
  }
  // Der Grund für zwei Hubs ergibt nur bei zwei Hubs Sinn
  if (!answers.secondRegion && answers.extras?.hubReason) answers.extras.hubReason = undefined;
  // "Nur für Business-Profile sichtbar" gibt es nur für Business-Profile selbst
  if (answers.profile?.visibility === "business" && track !== "business") {
    fail("Diese Sichtbarkeit ist nur für Business-Profile möglich.");
  }
  return { answers, token };
}
