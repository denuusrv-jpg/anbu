import "server-only";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { INTERESTS, REGIONS, VIBES, labelOf } from "@/lib/onboarding";

// Eisbrecher ("Spark"): eine Frage, die zu den Gemeinsamkeiten der Gesprächspartner passt.
// Die KI sieht nur Gemeinsamkeiten (Interessen, Vibe, Hub, Art), keine Namen, keine Texte, keine Nachrichten.

export type IcebreakerContext = {
  interests: string[]; // Ids der gemeinsamen Interessen
  vibes: string[];
  hub: string;
  track: "community" | "business";
  size: number;
  used: string[]; // schon gestellte Eisbrecher in diesem Raum
};

const SYSTEM = `Du bist der "Spark" von DSpora: Du eröffnest ein Gespräch zwischen Menschen der tamilischen Diaspora im deutschsprachigen Raum, die gematcht wurden.
Stelle GENAU EINE kurze, warme, konkrete Eisbrecher-Frage auf Deutsch (du-Form für alle, höchstens 30 Wörter), die zu den Gemeinsamkeiten passt und leicht zu beantworten ist.
Regeln:
- Greife eine der Gemeinsamkeiten auf, ohne zu raten, wer wer ist. Keine Namen.
- Nichts Heikles: nicht nach Gesundheit, Religion, Politik, Finanzen, Sexualität oder Adresse fragen.
- Wiederhole keine der bereits gestellten Fragen, auch nicht sinngemäß.
- Gib nur die Frage zurück, ohne Anrede und ohne Erklärung.`;

const schema = z.object({ question: z.string() });

// Regelbasierte Eisbrecher, falls die KI nicht verfügbar ist
const BY_INTEREST: Record<string, string[]> = {
  gym: ["Was ist euer aktuelles Trainingsziel, und trainiert ihr lieber allein oder zu zweit?", "Welche Übung macht ihr am liebsten, und welche am wenigsten?"],
  gaming: ["Welches Spiel könnt ihr gerade nicht weglegen, und mit wem spielt ihr am liebsten?", "Eher entspannt zocken oder ehrgeizig im Team: Was passt zu euch?"],
  kultur: ["Welche Tradition oder welches Fest aus eurer Kultur mögt ihr am meisten?", "Gibt es ein kulturelles Erlebnis, das ihr unbedingt mal teilen würdet?"],
  "deep-talks": ["Über welches Thema würdet ihr gern mal einen ganzen Abend reden?", "Welche Frage beschäftigt euch gerade am meisten?"],
  musik: ["Welcher Song läuft bei euch gerade rauf und runter?", "Welches Konzert würdet ihr gern zusammen besuchen?"],
  tanzen: ["Welchen Tanzstil würdet ihr gern lernen oder weiter vertiefen?", "Wann habt ihr zuletzt so richtig getanzt?"],
  essen: ["Was ist euer Lieblingsgericht, und würdet ihr es gern mal füreinander kochen?", "Welches Lokal in eurer Nähe muss man unbedingt kennen?"],
  reisen: ["Wohin soll eure nächste Reise gehen?", "Was war euer schönster Moment auf einer Reise?"],
  sport: ["Welchen Sport würdet ihr gern mal zusammen ausprobieren?", "Seid ihr eher Mannschafts- oder Einzelsportler?"],
  kreatives: ["Woran arbeitet ihr gerade kreativ, und was würdet ihr gern mal gemeinsam umsetzen?", "Was inspiriert euch am meisten?"],
  karriere: ["Welches berufliche Ziel treibt euch in diesem Jahr an?", "Welchen Rat hättet ihr gern früher in eurer Karriere bekommen?"],
  filme: ["Welcher Film oder welche Serie hat euch zuletzt richtig gepackt?", "Welchen Film könnt ihr immer wieder sehen?"],
};
const GENERIC = [
  "Was würdet ihr an einem freien Wochenende am liebsten gemeinsam unternehmen?",
  "Worauf freut ihr euch in den nächsten Wochen am meisten?",
  "Was ist eure Lieblingsecke in eurer Stadt?",
  "Welche kleine Gewohnheit macht euren Alltag besser?",
  "Was war das Beste, das euch diese Woche passiert ist?",
];
const BUSINESS = [
  "Woran arbeitet ihr gerade, und wobei würde euch ein Austausch am meisten helfen?",
  "Was war euer wichtigster Lernmoment in den letzten Monaten?",
  "Welche Art von Zusammenarbeit würdet ihr euch wünschen?",
];

export function ruleIcebreaker(ctx: IcebreakerContext): string {
  const pool: string[] = [];
  if (ctx.track === "business") pool.push(...BUSINESS);
  for (const id of ctx.interests) pool.push(...(BY_INTEREST[id] ?? []));
  pool.push(...GENERIC);
  return pool.find((q) => ctx.used.indexOf(q) < 0) ?? pool[Math.floor(Math.random() * pool.length)];
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-zäöüß0-9]+/g, " ").trim();

export function acceptIcebreaker(raw: string, used: string[]): string | null {
  const q = raw.replace(/\s+/g, " ").trim().replace(/^["„“'»]+|["“”'«]+$/g, "").trim();
  if (q.length < 10 || q.length > 260 || q.indexOf("?") < 0) return null;
  if (/https?:\/\/|www\.|@/i.test(q)) return null;
  if (used.some((u) => norm(u) === norm(q))) return null;
  return q.slice(0, q.lastIndexOf("?") + 1);
}

export async function aiIcebreaker(model: LanguageModel, ctx: IcebreakerContext): Promise<string | null> {
  const prompt = [
    `Gemeinsame Interessen: ${ctx.interests.map((i) => labelOf(i, INTERESTS)).join(", ") || "keine bekannt"}`,
    `Gemeinsamer Vibe: ${ctx.vibes.map((v) => labelOf(v, VIBES)).join(", ") || "nicht bekannt"}`,
    `Hub: ${labelOf(ctx.hub, REGIONS)}`,
    `Art: ${ctx.track === "business" ? "Business und Co-Founding" : "private Community"}, ${ctx.size} Personen`,
    ctx.used.length ? `Bereits gestellte Fragen (nicht wiederholen):\n${ctx.used.slice(-8).map((u) => `- ${u}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const { output } = await generateText({
    model,
    system: SYSTEM,
    prompt,
    output: Output.object({ schema }),
    temperature: 0.8,
    maxOutputTokens: 120,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(8000),
  });
  return acceptIcebreaker(output.question, ctx.used);
}
