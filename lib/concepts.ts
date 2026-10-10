// Begriffs-Zuordnung für das Matching: Eigene Wörter (z. B. "Padel", "Tennis", "Kicken") werden einem Begriff zugeordnet.
// Gleicher Begriff = volle Übereinstimmung, gleiche Gruppe oder gleiches Gebiet = ähnlich. So passen "Tennis" und "Padel"
// zusammen, ohne dass jemand dieselben Wörter tippen muss.
// Reine Berechnung ohne Datenbank und ohne KI. Die KI (lib/conceptAi.ts) ordnet nur Wörter zu, die hier nicht vorkommen.

import type { Choice } from "@/lib/onboarding";

export type Kind = "interest" | "vibe";

export type Concept = {
  id: string;
  label: string;
  area: string; // Gebiet, z. B. "sport"
  group: string; // Gruppe im Gebiet, z. B. "racket"
  keywords: string[]; // Wortteile (klein, ohne Umlaute), die auf den Begriff hinweisen
};

const c = (id: string, label: string, area: string, group: string, keywords: string[]): Concept => ({ id, label, area, group, keywords });

export const INTEREST_CONCEPTS: Concept[] = [
  // Sport
  c("tennis", "Tennis", "sport", "racket", ["tennis"]),
  c("padel", "Padel", "sport", "racket", ["padel", "paddel", "paddle", "pickleball"]),
  c("badminton", "Badminton", "sport", "racket", ["badminton", "federball"]),
  c("tischtennis", "Tischtennis", "sport", "racket", ["tischtennis", "pingpong", "ping pong"]),
  c("squash", "Squash", "sport", "racket", ["squash"]),
  c("fitness", "Fitness & Gym", "sport", "kraft", ["gym", "fitness", "kraftsport", "krafttraining", "workout", "bodybuilding", "calisthenics", "crossfit", "hyrox", "gewichtheben"]),
  c("laufen", "Laufen", "sport", "ausdauer", ["laufen", "joggen", "marathon", "running", "halbmarathon", "parkrun"]),
  c("radfahren", "Radfahren", "sport", "ausdauer", ["radfahren", "rennrad", "mountainbike", "mtb", "fahrrad", "cycling", "bikepacking"]),
  c("schwimmen", "Schwimmen", "sport", "ausdauer", ["schwimmen", "schwimm"]),
  c("fussball", "Fußball", "sport", "team", ["fussball", "kicken", "soccer", "bolzen"]),
  c("basketball", "Basketball", "sport", "team", ["basketball", "streetball"]),
  c("volleyball", "Volleyball", "sport", "team", ["volleyball", "beachvolleyball"]),
  c("handball", "Handball", "sport", "team", ["handball"]),
  c("cricket", "Cricket", "sport", "team", ["cricket"]),
  c("kampfsport", "Kampfsport", "sport", "kampf", ["kampfsport", "boxen", "mma", "muay", "thaiboxen", "kickboxen", "judo", "karate", "taekwondo", "bjj", "jiu", "ringen", "krav maga"]),
  c("wandern", "Wandern", "sport", "outdoor", ["wandern", "wanderung", "hiking", "trekking", "bergsteigen", "berge"]),
  c("klettern", "Klettern & Bouldern", "sport", "outdoor", ["klettern", "bouldern", "boulder"]),
  c("wassersport", "Wassersport", "sport", "outdoor", ["paddeln", "kajak", "kanu", "sup", "stand up paddling", "rudern", "segeln", "surfen", "wakeboard", "tauchen", "wassersport"]),
  c("wintersport", "Wintersport", "sport", "outdoor", ["ski", "snowboard", "skifahren", "langlauf", "wintersport"]),
  c("yoga", "Yoga & Pilates", "sport", "achtsam", ["yoga", "pilates", "meditation", "achtsamkeit", "stretching"]),
  c("sport", "Sport", "sport", "sport-allg", ["sport", "training", "sportlich"]),
  c("tanzen", "Tanzen", "sport", "tanz", ["tanzen", "tanz", "salsa", "bachata", "bollywood dance", "hiphop", "zumba", "bharatanatyam", "kizomba"]),
  // Musik
  c("musik-hoeren", "Musik & Konzerte", "musik", "musik", ["musik", "konzert", "festival", "playlist", "rap", "hip hop", "techno", "rock", "pop", "jazz", "klassik"]),
  c("musik-machen", "Musik machen", "musik", "musik-machen", ["gitarre", "klavier", "singen", "gesang", "dj", "produzieren", "beatmaking", "schlagzeug", "geige", "band", "instrument"]),
  // Kreatives
  c("kreatives", "Kreatives", "kreativ", "kreativ-allg", ["kreativ", "basteln", "diy", "nahen", "stricken", "handwerk", "tischlern"]),
  c("malen", "Zeichnen & Malen", "kreativ", "bildende-kunst", ["zeichnen", "malen", "illustration", "skizzieren", "kunst machen"]),
  c("fotografie", "Fotografie & Video", "kreativ", "bild", ["foto", "fotografie", "fotografieren", "videograf", "filmen", "videos drehen", "content creat"]),
  c("schreiben", "Schreiben", "kreativ", "wort", ["schreiben", "blog", "poesie", "gedicht", "autor", "storytelling"]),
  c("design", "Design", "kreativ", "bild", ["design", "grafikdesign", "ux", "ui design", "mode design"]),
  // Kultur & Wissen
  c("kultur", "Kultur", "kultur", "kultur", ["kultur", "museum", "theater", "ausstellung", "oper", "galerie", "kunst"]),
  c("tamil-kultur", "Tamil-Kultur", "kultur", "heimat", ["tamil", "kollywood", "tamilisch", "indisch", "sri lanka", "tempel fest", "bollywood"]),
  c("glaube", "Glaube & Spiritualität", "kultur", "glaube", ["glaube", "religion", "kirche", "tempel", "gebet", "spiritu", "moschee", "bibel"]),
  c("lesen", "Lesen", "wissen", "lesen", ["lesen", "buch", "buecher", "roman", "lekture", "bucherei"]),
  c("politik", "Politik & Gesellschaft", "wissen", "gesellschaft", ["politik", "gesellschaft", "geschichte", "nachrichten", "ehrenamt", "engagement", "aktivismus"]),
  c("wissenschaft", "Wissenschaft & Lernen", "wissen", "lernen", ["wissenschaft", "forschung", "physik", "mathe", "lernen", "weiterbildung", "sprachen lernen", "philosophie"]),
  // Medien & Spiele
  c("filme", "Filme & Serien", "medien", "film", ["film", "serie", "kino", "netflix", "movie", "streaming"]),
  c("anime", "Anime & Manga", "medien", "film", ["anime", "manga", "cosplay"]),
  c("gaming", "Gaming", "spiele", "digital", ["gaming", "zocken", "videospiel", "playstation", "xbox", "nintendo", "pc spiel", "esport", "e sport", "fifa", "valorant"]),
  c("brettspiele", "Brett- & Kartenspiele", "spiele", "analog", ["brettspiel", "spieleabend", "poker", "schach", "kartenspiel", "tabletop", "dnd", "rollenspiel"]),
  // Genuss & Ausgehen
  c("essen", "Essen & Restaurants", "genuss", "essen", ["essen", "restaurant", "foodie", "streetfood", "food", "brunch", "sushi"]),
  c("kochen", "Kochen & Backen", "genuss", "essen", ["kochen", "backen", "grillen", "bbq", "rezepte"]),
  c("kaffee", "Kaffee & Cafés", "genuss", "essen", ["kaffee", "cafe", "barista", "bubble tea", "tee"]),
  c("ausgehen", "Ausgehen & Party", "soziales", "ausgehen", ["party", "ausgehen", "club", "bar", "nightlife", "feiern", "cocktail"]),
  // Reisen & Natur
  c("reisen", "Reisen", "reisen", "reisen", ["reisen", "urlaub", "backpacking", "staedtetrip", "roadtrip", "weltreise", "verreisen"]),
  c("camping", "Camping & Natur", "natur", "natur", ["camping", "vanlife", "natur", "zelten", "garten", "outdoor"]),
  c("tiere", "Tiere", "natur", "tiere", ["hund", "katze", "tiere", "haustier", "pferd", "reiten"]),
  // Gespräche & Persönliches
  c("deep-talks", "Deep Talks", "gespraech", "gespraech", ["deep talk", "tiefgrundige gesprache", "gesprache", "diskutieren", "reden", "quatschen"]),
  c("persoenlichkeit", "Persönliche Entwicklung", "gespraech", "entwicklung", ["selbstentwicklung", "personlichkeit", "mindset", "psychologie", "coaching", "selbstfindung", "motivation", "journaling", "therapie"]),
  // Karriere, Business, Tech
  c("karriere", "Karriere & Business", "business", "karriere", ["karriere", "business", "beruf", "netzwerken", "networking", "management", "marketing", "vertrieb", "consulting"]),
  c("startup", "Startups & Gründen", "business", "gruenden", ["startup", "grunden", "unternehm", "selbststandig", "gruender", "side hustle"]),
  c("finanzen", "Finanzen & Investieren", "business", "finanzen", ["aktien", "krypto", "investier", "finanzen", "etf", "immobilien", "trading", "bitcoin"]),
  c("tech", "Tech & Programmieren", "business", "tech", ["tech", "programmier", "coding", "software", "ki ", "ai ", "kunstliche intelligenz", "informatik", "elektronik", "gadgets", "technik"]),
  // Lifestyle
  c("autos", "Autos & Motorräder", "lifestyle", "fahrzeuge", ["auto", "tuning", "motorrad", "cars", "car meet", "formel 1", "f1", "motorsport"]),
  c("mode", "Mode & Beauty", "lifestyle", "mode", ["mode", "fashion", "sneaker", "beauty", "styling", "makeup", "kleidung"]),
];

export const VIBE_CONCEPTS: Concept[] = [
  c("entspannt", "Entspannt", "vibe", "ruhe", ["entspannt", "chill", "gelassen", "locker", "relaxed", "easygoing", "gemutlich"]),
  c("ruhig", "Ruhig", "vibe", "ruhe", ["ruhig", "introvert", "zuruckhaltend", "schuchtern", "still", "leise", "nachdenklich ruhig"]),
  c("bodenstaendig", "Bodenständig", "vibe", "ruhe", ["bodenstandig", "geerdet", "ehrlich", "zuverlassig", "loyal", "bescheiden", "down to earth"]),
  c("zielorientiert", "Zielorientiert", "vibe", "antrieb", ["zielorientiert", "ehrgeiz", "ambition", "fokussiert", "strebsam", "diszipliniert", "organisiert", "leistung"]),
  c("tiefgruendig", "Tiefgründig", "vibe", "tiefe", ["tiefgrundig", "tiefsinnig", "philosoph", "reflektiert", "nachdenklich", "deep"]),
  c("empathisch", "Empathisch", "vibe", "tiefe", ["empath", "herzlich", "warmherzig", "hilfsbereit", "fursorglich", "einfuhlsam", "sozial"]),
  c("neugierig", "Neugierig", "vibe", "tiefe", ["neugier", "wissbegierig", "lernbereit", "offen fur neues", "interessiert"]),
  c("humorvoll", "Humorvoll", "vibe", "energie", ["humor", "lustig", "witzig", "spassig", "sarkas", "ironisch", "lachen"]),
  c("spontan", "Spontan", "vibe", "energie", ["spontan", "flexibel", "impulsiv", "unkompliziert"]),
  c("abenteuerlustig", "Abenteuerlustig", "vibe", "energie", ["abenteuer", "mutig", "risiko", "wagemutig", "entdecker", "draufganger"]),
  c("extrovertiert", "Extrovertiert", "vibe", "energie", ["extrovert", "gesellig", "kontaktfreudig", "energiegeladen", "offen", "kommunikativ", "laut", "aufgeschlossen"]),
  c("kreativ", "Kreativ", "vibe", "energie", ["kreativ", "kunstlerisch", "ideenreich", "fantasievoll", "erfinderisch"]),
];

// Die vorgegebenen Antworten aus dem Chat (Ids in lib/onboarding.ts) zeigen auf einen Begriff
const INTEREST_ID_TO_CONCEPT: Record<string, string> = {
  gym: "fitness",
  gaming: "gaming",
  kultur: "kultur",
  "deep-talks": "deep-talks",
  musik: "musik-hoeren",
  tanzen: "tanzen",
  essen: "essen",
  reisen: "reisen",
  sport: "sport",
  kreatives: "kreatives",
  karriere: "karriere",
  filme: "filme",
};
const VIBE_ID_TO_CONCEPT: Record<string, string> = {
  entspannt: "entspannt",
  zielorientiert: "zielorientiert",
  kreativ: "kreativ",
  abenteuerlustig: "abenteuerlustig",
  humorvoll: "humorvoll",
  tiefgruendig: "tiefgruendig",
  spontan: "spontan",
  bodenstaendig: "bodenstaendig",
};

const LISTS: Record<Kind, Concept[]> = { interest: INTEREST_CONCEPTS, vibe: VIBE_CONCEPTS };
const BY_ID: Record<Kind, Map<string, Concept>> = {
  interest: new Map(INTEREST_CONCEPTS.map((x) => [x.id, x])),
  vibe: new Map(VIBE_CONCEPTS.map((x) => [x.id, x])),
};

/** Kleinschreibung, ohne Umlaute und Sonderzeichen, einfache Leerzeichen. */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Alle Schlüsselwörter, längste zuerst: "paddeln" (Wassersport) gewinnt gegen "paddel" (Padel)
const KEYWORDS: Record<Kind, { word: string; id: string }[]> = {
  interest: buildKeywords(INTEREST_CONCEPTS),
  vibe: buildKeywords(VIBE_CONCEPTS),
};

function buildKeywords(list: Concept[]) {
  const out: { word: string; id: string }[] = [];
  for (const concept of list) for (const word of concept.keywords) out.push({ word: normalizeTerm(word), id: concept.id });
  return out.sort((a, b) => b.word.length - a.word.length);
}

/** Begriff zu einem Wort, nur anhand der Regeln. Unbekanntes bleibt als "x:wort" erhalten (gleiche Wörter passen trotzdem). */
export function conceptByRules(term: string, kind: Kind): string | null {
  const text = ` ${normalizeTerm(term)} `;
  if (text.trim().length === 0) return null;
  const hit = KEYWORDS[kind].find((k) => {
    const word = k.word;
    // Kurze Wörter nur als ganzes Wort (z. B. "dj", "ui"), längere auch als Wortteil
    return word.length <= 3 ? text.includes(` ${word} `) : text.includes(word);
  });
  return hit ? hit.id : null;
}

export function unknownConcept(term: string): string {
  return `x:${normalizeTerm(term)}`;
}

export function isKnownConcept(id: string, kind: Kind): boolean {
  return BY_ID[kind].has(id);
}

export function conceptIdsFor(kind: Kind): string[] {
  return LISTS[kind].map((x) => x.id);
}

/** Beschriftung eines Begriffs (bei "x:wort" das Wort selbst). */
export function conceptLabel(id: string, kind: Kind): string {
  const known = BY_ID[kind].get(id);
  if (known) return known.label;
  return id.startsWith("x:") ? id.slice(2) : id;
}

/** Begriffe aller Einträge einer Auswahl (Vorgaben und eigene Wörter), ohne Doppelte. */
export function conceptsOfChoice(value: Choice, kind: Kind, aiMap: Record<string, string> = {}): string[] {
  const idMap = kind === "interest" ? INTEREST_ID_TO_CONCEPT : VIBE_ID_TO_CONCEPT;
  const out: string[] = [];
  for (const id of value.ids) out.push(idMap[id] ?? unknownConcept(id));
  for (const word of value.custom) {
    out.push(aiMap[word] ?? conceptByRules(word, kind) ?? unknownConcept(word));
  }
  return Array.from(new Set(out));
}

/** Ähnlichkeit zweier Begriffe: 3 = gleich, 2 = gleiche Gruppe, 1 = gleiches Gebiet, 0 = nichts. */
export function relation(a: string, b: string, kind: Kind): 0 | 1 | 2 | 3 {
  if (a === b) return 3;
  const ca = BY_ID[kind].get(a);
  const cb = BY_ID[kind].get(b);
  if (!ca || !cb) return 0;
  if (ca.group === cb.group) return 2;
  if (kind === "interest" && ca.area === cb.area) return 1;
  return 0;
}

export type ConceptMatch = { a: string; b: string; level: 1 | 2 | 3 };

/**
 * Beste Zuordnung zwischen zwei Listen von Begriffen: jeder Begriff zählt höchstens einmal.
 * Zuerst gleiche, dann ähnliche Begriffe (greedy nach Ähnlichkeit).
 */
export function matchConcepts(listA: string[], listB: string[], kind: Kind): ConceptMatch[] {
  const pairs: ConceptMatch[] = [];
  for (const a of listA) for (const b of listB) {
    const level = relation(a, b, kind);
    if (level > 0) pairs.push({ a, b, level: level as 1 | 2 | 3 });
  }
  pairs.sort((x, y) => y.level - x.level);
  const usedA = new Set<string>();
  const usedB = new Set<string>();
  const out: ConceptMatch[] = [];
  for (const p of pairs) {
    if (usedA.has(p.a) || usedB.has(p.b)) continue;
    usedA.add(p.a);
    usedB.add(p.b);
    out.push(p);
  }
  return out;
}

/** Zugeordnete Wörter, die die Regeln nicht kennen (nur diese gehen an die KI). */
export function unknownTerms(value: Choice, kind: Kind): string[] {
  return value.custom.filter((word) => conceptByRules(word, kind) === null);
}

