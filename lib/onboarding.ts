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

export const VISIBILITIES: Option[] = [
  { id: "matches", label: "Nur meine Matches" },
  { id: "crew", label: "Meine Crew" },
  { id: "community", label: "Alle in der Community" },
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

export type FollowUp = { question: string; answer: string };

export type OnboardingAnswers = {
  region: string; // Id aus REGIONS oder eigener Text
  city?: string;
  interests: Choice;
  vibes: Choice;
  mode: (typeof PROFILE_MODES)[number];
  profile?: ProfileData;
  extras?: {
    freeText?: string; // freier Text aus dem Pfad "Profil anlegen"
    followUps?: FollowUp[]; // 1-2 Folgefragen samt Antworten
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
export const MAX_CUSTOM = 5;
export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const MAX_PHOTOS = 3;
export const MAX_HOBBIES = 8;

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
