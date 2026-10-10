// Gemeinsame Auswahllisten und Typen für den Onboarding-Chat (Frontend) und die API-Prüfung.

export type Option = { id: string; label: string };

export const REGIONS: Option[] = [
  { id: "nrw", label: "NRW" },
  { id: "rhein-main", label: "Rhein-Main" },
  { id: "baden-wuerttemberg", label: "Baden-Württemberg" },
  { id: "bayern", label: "Bayern" },
  { id: "berlin-ost", label: "Berlin & Ost" },
  { id: "hamburg-nord", label: "Hamburg & Nord" },
  { id: "schweiz", label: "Schweiz" },
  { id: "oesterreich", label: "Österreich" },
];

// Zusätzliche "Hubs" für Leute ohne Region: reine Online-Freundschaften und Orte ohne Hub in der Nähe
export const PSEUDO_HUBS: Option[] = [
  { id: "online", label: "Online" },
  { id: "warteliste", label: "Warteliste (noch kein Hub in der Nähe)" },
];
export const ALL_HUBS: Option[] = [...REGIONS, ...PSEUDO_HUBS];

export const INTERESTS: Option[] = [
  { id: "gym", label: "Gym" },
  { id: "gaming", label: "Gaming" },
  { id: "kultur", label: "Kultur" },
  { id: "deep-talks", label: "Deep Talks" },
  { id: "musik", label: "Musik" },
  { id: "tanzen", label: "Tanzen" },
  { id: "essen", label: "Essen & Kochen" },
  { id: "reisen", label: "Reisen" },
  { id: "sport", label: "Sport" },
  { id: "kreatives", label: "Kreatives" },
  { id: "karriere", label: "Karriere & Business" },
  { id: "filme", label: "Filme & Serien" },
];

export const VIBES: Option[] = [
  { id: "entspannt", label: "Entspannt" },
  { id: "zielorientiert", label: "Zielorientiert" },
  { id: "kreativ", label: "Kreativ" },
  { id: "abenteuerlustig", label: "Abenteuerlustig" },
  { id: "humorvoll", label: "Humorvoll" },
  { id: "tiefgruendig", label: "Tiefgründig" },
  { id: "spontan", label: "Spontan" },
  { id: "bodenstaendig", label: "Bodenständig" },
];

export const LANGUAGES: Option[] = [
  { id: "tamil", label: "Tamil" },
  { id: "deutsch", label: "Deutsch" },
  { id: "englisch", label: "Englisch" },
  { id: "franzoesisch", label: "Französisch" },
  { id: "mix", label: "Mix aus allem" },
];

// Profil
export const PHASES: Option[] = [
  { id: "schule", label: "Schule" },
  { id: "studium", label: "Studium" },
  { id: "ausbildung", label: "Ausbildung" },
  { id: "beruf", label: "Beruf" },
  { id: "sonstiges", label: "Sonstiges" },
];

// Wer darf mein Profil sehen? (wird in der Datenbank durchgesetzt, siehe supabase/schema.sql)
export const VISIBILITIES: Option[] = [
  { id: "public", label: "Öffentlich für alle registrierten DSpora-Minds" },
  { id: "business", label: "Nur für andere Business-Profile sichtbar" },
  { id: "stealth", label: "Stealth: nur nach gegenseitigem Match" },
];

// Geschlecht (Selbstangabe, freiwillig) und mit wem man sich verbinden möchte.
// Die Angaben beziehen sich immer auf die Selbstidentifikation: trans Frauen sind Frauen, trans Männer sind Männer.
// Alte Ids (nonbinary, na) bleiben gültig, damit bereits gespeicherte Profile weiter funktionieren.
export const GENDERS: Option[] = [
  { id: "female", label: "Weiblich" },
  { id: "male", label: "Männlich" },
  { id: "nonbinary", label: "Nicht-binär / divers" },
  { id: "na", label: "Möchte ich nicht angeben" },
];

// Im Chat: nur zwei Auswahlfelder, alles andere schreibt die Person selbst
export const GENDER_CHOICES: Option[] = [
  { id: "male", label: "Männlich" },
  { id: "female", label: "Weiblich" },
];

// Wunsch an das Gegenüber. "mixed" gibt es nur für Gruppen (Crew, Squad).
export const MATCH_GENDERS: Option[] = [
  { id: "any", label: "Egal" },
  { id: "female", label: "Weiblich" },
  { id: "male", label: "Männlich" },
  { id: "other", label: "Anderes" },
  { id: "mixed", label: "Gemischt" },
];

export const DUO_WISHES: Option[] = [
  { id: "male", label: "Männliche Freundschaften" },
  { id: "female", label: "Weibliche Freundschaften" },
  { id: "any", label: "Egal, mir ist es wichtig, dass es passt" },
];

export const GROUP_WISHES: Option[] = [
  { id: "mixed", label: "Gemischte Gruppe" },
  { id: "male", label: "Nur Männer" },
  { id: "female", label: "Nur Frauen" },
  { id: "any", label: "Egal, Hauptsache Match" },
];

/** Grobe Zuordnung des Geschlechts einer Person: männlich, weiblich oder anderes (auch eigene Wörter). */
export function genderGroup(value: string | null | undefined): "male" | "female" | "other" | "unknown" {
  if (!value) return "unknown";
  const v = value.trim().toLowerCase();
  if (v === "male" || /^(m|mann|männlich|maennlich|junge|boy|man|he|er)$/.test(v) || v.startsWith("männ") || v.startsWith("maenn")) return "male";
  if (v === "female" || /^(w|f|frau|weiblich|mädchen|maedchen|girl|woman|she|sie)$/.test(v) || v.startsWith("weib")) return "female";
  if (v === "na") return "unknown";
  return "other";
}

// Gewünschte Gruppengröße (Duo, Crew, Squad wie auf der Startseite)
export const GROUP_SIZES: Option[] = [
  { id: "duo", label: "Duo (2er Gruppe)" },
  { id: "crew", label: "Crew (4er Gruppe)" },
  { id: "squad", label: "Squad (8er Gruppe)" },
  { id: "any", label: "Egal" },
];

// Wie oft würde man eine Person maximal sehen wollen? (bei längeren Gesprächen)
// Wie oft sieht man sich realistisch? (alte Ids weekend, multi, flexible bleiben in gespeicherten Daten möglich)
export const MEET_FREQUENCIES: Option[] = [
  { id: "rare", label: "Seltener als 1× im Monat" },
  { id: "monthly", label: "1–2× im Monat" },
  { id: "weekly", label: "1–2× pro Woche" },
  { id: "often", label: "3× pro Woche oder öfter" },
];

export const MEET_MODES: Option[] = [
  { id: "online", label: "Nur online schreiben" },
  { id: "activities", label: "Auch gemeinsame Aktivitäten und Hobbys vor Ort" },
];

// Maximale Fahrzeit mit dem Auto. Der Wert 0 steht für "Egal".
export const TRAVEL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 10, label: "10 Minuten" },
  { minutes: 20, label: "20 Minuten" },
  { minutes: 45, label: "45 Minuten" },
  { minutes: 60, label: "1 Stunde" },
  { minutes: 120, label: "2 Stunden" },
  { minutes: 0, label: "Egal" },
];

// Vorschläge im Chat (vier pro Frage), der Rest wird frei eingegeben
export const INTEREST_SUGGESTIONS: Record<"community" | "business", string[]> = {
  community: ["gym", "musik", "reisen", "essen"],
  business: ["sport", "reisen", "essen", "kultur"],
};
export const VIBE_SUGGESTIONS: Record<"community" | "business", string[]> = {
  community: ["entspannt", "humorvoll", "spontan", "tiefgruendig"],
  business: ["zielorientiert", "humorvoll", "entspannt", "kreativ"],
};
export const MAX_INTERESTS = 5;
export const MIN_INTERESTS = 2;
export const MAX_VIBES = 5;
export const FREE_FIELDS = 8; // leere Eingabefelder für eigene Begriffe

export const TRACKS: Option[] = [
  { id: "community", label: "Friends-Community" },
  { id: "business", label: "Business-Community" },
];

// Business-Modus
export const SECTORS: Option[] = [
  { id: "tech", label: "Tech & Software" },
  { id: "finance", label: "Finanzen & Investment" },
  { id: "health", label: "Gesundheit & Medizin" },
  { id: "commerce", label: "Handel & E-Commerce" },
  { id: "media", label: "Medien & Kreatives" },
  { id: "education", label: "Bildung & Forschung" },
  { id: "food", label: "Gastronomie & Food" },
  { id: "realestate", label: "Immobilien & Bau" },
  { id: "consulting", label: "Beratung & Services" },
  { id: "industry", label: "Industrie & Handwerk" },
];

export const GOALS: Option[] = [
  { id: "cofounder", label: "Co-Founder finden" },
  { id: "investors", label: "Investoren-Austausch" },
  { id: "collab", label: "Projekt-Kollaboration" },
  { id: "mentoring", label: "Mentoring" },
  { id: "partners", label: "Kunden & Partner finden" },
  { id: "network", label: "Netzwerk aufbauen" },
];

export const PROFILE_MODES = ["anonymous", "profile"] as const;

// Auswahl aus Vorgaben (ids) plus eigene Einträge (custom)
export type Choice = { ids: string[]; custom: string[] };

export type ProfileData = {
  displayName: string;
  age?: number;
  hobbies: string[];
  languages: Choice;
  phase?: string; // Id aus PHASES oder eigener Text
  funFact?: string;
  askMeAbout?: string;
  visibility: string;
  photoCount: number;
};

// Light-CV: kompakter beruflicher Steckbrief
export type LightCv = {
  expertise?: string;
  achievements: string[]; // Top-3-Erfolge oder Meilensteine
  links: string[]; // Portfolio / GitHub / Website
};

export type BusinessData = {
  sector: string; // Id aus SECTORS oder eigener Text
  role: string; // aktuelle berufliche Rolle
  goals: Choice;
  cv: LightCv;
};

export type FollowUp = { question: string; answer: string };

// Eine Zeile des Chatverlaufs (pro Konto gespeichert, für Nutzer nicht sichtbar)
export type ChatTurn = { role: "bot" | "user"; text: string };

export type OnboardingAnswers = {
  gender?: string; // Id aus GENDERS oder eigener Text
  matchGender?: string; // Id aus MATCH_GENDERS
  groupSize?: string; // Id aus GROUP_SIZES
  // Phase 1 (Basisfragen für das Matching)
  age?: number;
  ageMin?: number;
  ageMax?: number;
  meetMode?: "online" | "activities";
  travelMinutes?: number | null; // maximale Fahrzeit mit dem Auto, leer = egal
  languages?: Choice;
  lifePhase?: string; // Id aus PHASES oder eigener Text
  lat?: number; // grob gerundet, aus dem Ort berechnet
  lng?: number;
  region: string; // erster gewählter Hub: Id aus REGIONS oder eigener Text
  secondRegion?: string; // optional zweiter Hub (höchstens zwei)
  city?: string;
  interests: Choice;
  vibes: Choice;
  mode: (typeof PROFILE_MODES)[number];
  track?: "community" | "business";
  business?: BusinessData;
  profile?: ProfileData;
  extras?: {
    freeText?: string; // freier Text aus dem Pfad "Profil anlegen"
    followUps?: FollowUp[]; // Fragen und Antworten aus dem längeren Gespräch
    hubReason?: string; // Warum zwei Hubs? (nur bei zwei gewählten Hubs)
    meetFrequency?: string; // Id aus MEET_FREQUENCIES oder eigener Text: wie oft man sich maximal sehen will
    wishes?: string; // Wünsche und Ideen für DSpora (Finale)
  };
};

// Als Strings gebaut, da das Ziel-Target das u-Flag im Literal nicht erlaubt.
// Buchstaben (auch Tamil), Zahlen, Combining Marks, Leerzeichen und ein paar Satzzeichen.
export const NAME_PATTERN = new RegExp("^[\\p{L}\\p{N}\\p{M} _.-]{2,24}$", "u");
export const CUSTOM_PATTERN = new RegExp("^[\\p{L}\\p{N}\\p{M} &+'._-]{2,30}$", "u");

export const FREE_TEXT_MAX = 1500;
export const FOLLOW_UP_ANSWER_MAX = 600;
export const WISHES_MAX = 1500;
export const MAX_CHOICES = 8;
export const MAX_HUBS = 2;
export const MAX_TRANSCRIPT = 300; // Zeilen des Chatverlaufs pro Speichervorgang
export const TRANSCRIPT_TEXT_MAX = 800;
export const MAX_FOLLOW_UPS = 100; // Fragen und Antworten aus dem längeren Gespräch (insgesamt)
export const HUB_REASON_MAX = 300;
export const MAX_CUSTOM = 5;
export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const MAX_PHOTOS = 3;
export const MAX_HOBBIES = 8;
export const MAX_ACHIEVEMENTS = 3;
export const MAX_LINKS = 3;
export const ACHIEVEMENT_MAX = 200;
export const EXPERTISE_MAX = 100;
export const ROLE_MAX = 60;

/** Beschriftung einer Id (oder bei eigenem Text der Text selbst). */
export function labelOf(value: string, options: Option[]): string {
  return options.find((o) => o.id === value)?.label ?? value;
}

/** Beschriftungen einer Auswahl (Vorgaben + eigene Einträge) als Liste. */
export function choiceLabels(choice: Choice, options: Option[]): string[] {
  return [
    ...choice.ids.map((id) => options.find((o) => o.id === id)?.label ?? id),
    ...choice.custom,
  ];
}
