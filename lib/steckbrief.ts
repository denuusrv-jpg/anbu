// Der Steckbrief: das, was DSpora über eine Person weiß. Er wird aus den Profil-Angaben und den Antworten
// im Gespräch zusammengesetzt, ist also immer der aktuelle Stand. Chat, Profil und Admin nutzen dieselbe Funktion.

import {
  GENDERS,
  GOALS,
  GROUP_SIZES,
  INTERESTS,
  MATCH_GENDERS,
  MEET_FREQUENCIES,
  REGIONS,
  SECTORS,
  VIBES,
  choiceLabels,
  labelOf,
  type BusinessData,
  type Choice,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export type SteckbriefLine = { label: string; value: string };
// kind "free": der freie Text vom Anfang, "follow": Antwort auf eine Frage im Gespräch
export type SteckbriefFact = { kind: "free" | "follow"; question: string; answer: string };
export type Steckbrief = { lines: SteckbriefLine[]; facts: SteckbriefFact[] };

export type SteckbriefSource = {
  gender?: string | null;
  matchGender?: string | null;
  groupSize?: string | null;
  region?: string | null;
  secondRegion?: string | null;
  city?: string | null;
  interests?: Choice | null;
  vibes?: Choice | null;
  track?: "community" | "business" | null;
  business?: BusinessData | null;
  extras?: OnboardingAnswers["extras"] | null;
};

export const FREE_FACT_QUESTION = "Frei erzählt";

export function buildSteckbrief(src: SteckbriefSource): Steckbrief {
  const lines: SteckbriefLine[] = [];
  const add = (label: string, value: string | undefined | null) => {
    if (value && value.trim()) lines.push({ label, value });
  };

  add("Geschlecht", src.gender ? labelOf(src.gender, GENDERS) : undefined);
  add("Verbinden mit", src.matchGender ? labelOf(src.matchGender, MATCH_GENDERS) : undefined);
  add("Gruppengröße", src.groupSize ? labelOf(src.groupSize, GROUP_SIZES) : undefined);
  const hubs = [src.region, src.secondRegion].filter((r): r is string => Boolean(r)).map((r) => labelOf(r, REGIONS));
  add(hubs.length > 1 ? "Hubs" : "Hub", hubs.join(" + "));
  add("Stadt", src.city);
  add("Interessen", src.interests ? choiceLabels(src.interests, INTERESTS).join(", ") : undefined);
  add("Vibe", src.vibes ? choiceLabels(src.vibes, VIBES).join(", ") : undefined);
  add("Grund für zwei Hubs", src.extras?.hubReason);
  add(
    "Maximale Treffhäufigkeit",
    src.extras?.meetFrequency ? labelOf(src.extras.meetFrequency, MEET_FREQUENCIES) : undefined,
  );
  if (src.track === "business" && src.business) {
    add("Business", `${labelOf(src.business.sector, SECTORS)} · ${src.business.role}`);
    add("Business-Ziele", choiceLabels(src.business.goals, GOALS).join(", "));
    add("Expertise", src.business.cv.expertise);
  }

  const facts: SteckbriefFact[] = [];
  if (src.extras?.freeText) facts.push({ kind: "free", question: FREE_FACT_QUESTION, answer: src.extras.freeText });
  for (const f of src.extras?.followUps ?? []) facts.push({ kind: "follow", question: f.question, answer: f.answer });

  return { lines, facts };
}

const clip = (text: string, max = 160) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Der Steckbrief als Chat-Nachricht (Zeilenumbrüche werden im Chat angezeigt). */
export function steckbriefText(sb: Steckbrief): string {
  if (sb.lines.length === 0 && sb.facts.length === 0) {
    return "Bisher weiß ich noch nicht viel über dich. Erzähl mir gern mehr, dann entsteht dein Steckbrief.";
  }
  const parts: string[] = ["Das weiß ich aktuell über dich:"];
  for (const line of sb.lines) parts.push(`• ${line.label}: ${clip(line.value)}`);
  if (sb.facts.length > 0) {
    parts.push("", "Das hast du mir erzählt:");
    for (const f of sb.facts) {
      parts.push(f.kind === "free" ? `• ${clip(f.answer)}` : `• ${clip(f.question, 80)} → ${clip(f.answer, 100)}`);
    }
  }
  return parts.join("\n");
}

/** Fragt jemand nach dem eigenen Steckbrief / Profil? */
export function isSteckbriefRequest(text: string): boolean {
  return new RegExp(
    "(steckbrief|was (wei(ß|ss)t|kennst|hast) du (alles )?(schon |bisher |so )?(über|von|zu) mich|was steht (alles )?in meinem profil|wie sieht (mein|meine) (profil|angaben)|was hast du (dir )?(über mich )?gemerkt|zeig (mir )?(mein )?profil)",
    "i",
  ).test(text);
}

/** Will jemand etwas aus dem Steckbrief entfernen lassen? */
export function isRemoveRequest(text: string): boolean {
  return /^\s*(bitte\s+)?(vergiss|lösche|loesche|entferne|streiche?)\b/i.test(text);
}
