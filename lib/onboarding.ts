// Gemeinsame Auswahllisten für den Onboarding-Chat (Frontend) und die API-Prüfung.

export const REGIONS = [
  { id: "nrw", label: "NRW" },
  { id: "rhein-main", label: "Rhein-Main" },
  { id: "baden-wuerttemberg", label: "Baden-Württemberg" },
  { id: "bayern", label: "Bayern" },
  { id: "berlin-ost", label: "Berlin & Ost" },
  { id: "hamburg-nord", label: "Hamburg & Nord" },
  { id: "schweiz", label: "Schweiz" },
  { id: "oesterreich", label: "Österreich" },
  { id: "anderswo", label: "Woanders" },
] as const;

export const INTERESTS = [
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
] as const;

export const VIBES = [
  { id: "entspannt", label: "Entspannt" },
  { id: "zielorientiert", label: "Zielorientiert" },
  { id: "kreativ", label: "Kreativ" },
  { id: "abenteuerlustig", label: "Abenteuerlustig" },
] as const;

export const PROFILE_MODES = ["anonymous", "pseudonym"] as const;

export type OnboardingAnswers = {
  region: string;
  city?: string;
  interests: string[];
  vibe: string;
  mode: (typeof PROFILE_MODES)[number];
  alias?: string;
};

// Buchstaben (auch Tamil), Zahlen, Leerzeichen und _ . -  (als String, da das Ziel-Target das u-Flag im Literal nicht erlaubt)
export const ALIAS_PATTERN = new RegExp("^[\\p{L}\\p{N}\\p{M} _.-]{2,24}$", "u");
export const MAX_INTERESTS = 8;
