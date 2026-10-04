// Antworten des Chats auf Fragen zu DSpora. Alles hier stammt aus den Texten der Webseite
// (Startseite, "Unsere Mission") und aus dem, was der Chat und das Profil selbst anbieten.
// Es wird nichts dazu erfunden: Was hier nicht steht, beantwortet der Chat nicht, sondern verweist
// auf das Kontaktformular.

export type ChatLink = { href: string; label: string };
export type SiteAnswer = { text: string; link?: ChatLink };

type Entry = {
  /** Wortanfänge (kleingeschrieben), die zur Frage passen */
  keywords: string[];
  answer: SiteAnswer;
};

const MISSION: ChatLink = { href: "/mission", label: "Unsere Mission lesen" };
const CONTACT: ChatLink = { href: "/kontakt", label: "Zum Kontaktformular" };
const PRIVACY: ChatLink = { href: "/datenschutz", label: "Zur Datenschutzerklärung" };

const ENTRIES: Entry[] = [
  {
    keywords: ["kost", "gratis", "umsonst", "preis", "bezahl", "geld", "abo", "gebühr", "gebuehr", "sponsor"],
    answer: {
      text: "Die Kernnutzung von DSpora ist für dich vollkommen kostenlos. Sollten wir die Plattform künftig durch ausgewählte Community-Partner oder dezente Sponsoren unterstützen, dient das laut unserer Mission nur dem Erhalt und der Weiterentwicklung des Projekts.",
      link: MISSION,
    },
  },
  {
    keywords: ["anonym", "diskret", "name", "foto", "profilbild", "sichtbar", "sehen", "stigma", "versteck"],
    answer: {
      text: "Anonymität ist bei uns eine Option, kein Zwang: Du kannst geschützt und anonym starten und dich erst öffnen, wenn der passende Freundeskreis gefunden ist. Genauso kannst du von Anfang an mit Namen, Profilbild und Stadt auftreten. Wer dein Profil sehen darf, stellst du selbst ein.",
    },
  },
  {
    keywords: ["wann", "start", "hub", "freigeschaltet", "freischalt", "öffnet", "oeffnet", "100", "region", "stadt", "nrw", "bayern", "hamburg", "berlin", "schweiz", "österreich", "oesterreich", "rhein", "baden"],
    answer: {
      text: "Sobald sich 100 Personen in einer Region eintragen, öffnet sich der Hub dieser Region. Es gibt Hubs für NRW, Rhein-Main, Baden-Württemberg, Bayern & Allgäu, Hauptstadt & Ost, Hamburg & Nord, die Schweiz und Österreich. Ein festes Startdatum nennt die Webseite nicht. Du kannst den Link teilen, so wird dein Hub schneller freigeschaltet.",
    },
  },
  {
    keywords: ["duo", "crew", "squad", "gruppe", "gruppengröße", "gruppengroesse"],
    answer: {
      text: "Du wählst die Gruppengröße, die zu deinem sozialen Akku passt. Das Duo (2er Gruppe) ist ideal für Workouts, Joggen oder Business-Kontakte. Die Crew (4er Gruppe) passt zu Spieleabenden, Gaming oder Veranstaltungen. Der Squad (8er Gruppe) eignet sich für lebendige Events, Ausflüge oder Tanzgruppen.",
    },
  },
  {
    keywords: ["ki", "künstliche", "kuenstliche", "intelligenz", "match", "algorithmus", "persönlichkeits", "persoenlichkeits", "check", "fragebogen", "optik", "aussehen"],
    answer: {
      text: "Der KI-Persönlichkeits-Check ist kein starrer Fragebogen, sondern ein entspanntes Gespräch. Wie lange es dauert, liegt ganz bei dir. Daraus finden wir dein Match für Duo, Crew oder Squad. Deine Optik ist dabei völlig irrelevant, es zählt nur, dass deine Persönlichkeit zu deinen Leuten passt.",
      link: MISSION,
    },
  },
  {
    keywords: ["mission", "warum gibt", "wofür", "wofuer", "idee", "hintergrund", "ziel von", "herzensprojekt", "einsam"],
    answer: {
      text: "DSpora ist ein Herzensprojekt für die tamilische Community im deutschsprachigen Raum. Wir glauben nicht an den reinen Zufall, wenn es um echte Freundschaften geht, und wollen Menschen mit denselben Wurzeln und passenden Interessen zusammenbringen, damit niemand im Stillen verloren geht.",
      link: MISSION,
    },
  },
  {
    keywords: ["tamil", "diaspora", "zielgruppe", "für wen", "fuer wen", "wer darf", "deutschland", "community"],
    answer: {
      text: "DSpora wurde exklusiv für die tamilische Community in Deutschland, Österreich und der Schweiz ins Leben gerufen.",
      link: MISSION,
    },
  },
  {
    keywords: ["business", "co-founder", "cofounder", "founder", "mentor", "partner", "geschäft", "geschaeft", "light-cv", "lebenslauf", "karriere", "investor"],
    answer: {
      text: "DSpora ist nicht nur für Freundschaften da: Du kannst die Plattform auch für Business-Kontakte nutzen, zum Beispiel, um Co-Founder, Partner oder Mentoren zu finden. Dafür legst du im Onboarding ein kurzes Light-CV an und bestimmst selbst, wer dich sehen darf.",
    },
  },
  {
    keywords: ["passwort", "login", "anmeld", "einlog", "registr", "konto", "account", "passkey", "face id"],
    answer: {
      text: "Ein Passwort brauchst du bei DSpora nicht. Du meldest dich über einen Link an, den wir dir per E-Mail schicken. In deinem Profil kannst du außerdem einen Passkey einrichten, um dich mit Face ID oder Touch ID anzumelden. Dein Konto kannst du dort auch jederzeit selbst löschen.",
    },
  },
  {
    keywords: ["treffen", "vor ort", "chatten", "schreiben", "kontakt zu anderen", "kennenlernen"],
    answer: {
      text: "Uns geht es um echte Treffen statt endlosem Hin-und-her-Schreiben: Von der Webseite aus geht es direkt zum gemeinsamen Treffen, Freundschaften entstehen vor Ort. Die KI vernetzt dich dafür mit Leuten aus deiner Nähe, die ähnliche Interessen haben, zum Beispiel Sport, Gaming oder Kultur.",
    },
  },
  {
    keywords: ["spam", "newsletter", "e-mail", "email", "mail"],
    answer: {
      text: "Das Ganze bleibt anfangs vollkommen anonym und ganz ohne Spam. Deine E-Mail-Adresse bleibt für andere unsichtbar.",
    },
  },
  {
    keywords: ["daten", "datenschutz", "speicher", "dsgvo", "löschen", "loeschen"],
    answer: {
      text: "Deine E-Mail-Adresse bleibt für andere unsichtbar, und dein Konto kannst du in deinem Profil jederzeit selbst löschen. Alles Weitere zum Umgang mit Daten findest du in der Datenschutzerklärung.",
      link: PRIVACY,
    },
  },
  {
    keywords: ["wer steckt", "gründer", "gruender", "team", "betreiber", "verantwortlich", "firma", "unternehmen", "impressum", "hinter dspora", "hinter euch"],
    answer: {
      text: "Zu den Personen hinter DSpora kann ich dir hier keine Angaben machen, ich möchte nichts erfinden. Auf der Webseite steht nur, dass DSpora ein Herzensprojekt für die Community ist. Für alles Weitere schreib uns gern über das Kontaktformular.",
      link: CONTACT,
    },
  },
  {
    keywords: ["kontakt", "erreichen", "support", "hilfe", "feedback"],
    answer: {
      text: "Du erreichst uns über das Kontaktformular. Hier im Chat geht es in erster Linie darum, dich kennenzulernen.",
      link: CONTACT,
    },
  },
];

const UNKNOWN: SiteAnswer = {
  text: "Dazu habe ich leider keine gesicherte Information, und ich möchte nichts erfinden. Hier geht es in erster Linie darum, dich kennenzulernen. Fragen, die nicht zum Thema gehören, kann ich deshalb nicht beantworten. Schreib uns dazu gern über das Kontaktformular.",
  link: CONTACT,
};

const INTERROGATIVE = new RegExp(
  "^(wie|was|wer|wo|wann|warum|wieso|weshalb|welche[nrms]?|wieviel|woher|wohin|wofür|wozu|kann|kannst|könnt|koennt|gibt|ist|sind|habt|seid|kostet|muss|darf|wird|werden|bekomm\\w*|geht|brauch\\w*|benötig\\w*|benoetig\\w*|stimmt|funktioniert|bedeutet|passiert|läuft|laeuft)\\b",
  "i",
);
// Aussagen, die sich an den Chat oder an DSpora richten
const ADDRESSED = new RegExp("\\b(du|dich|dir|ihr|euch|euer|eure|eurer|dspora|bot|ki|chat)\\b", "i");

function startsWith(text: string, keyword: string): boolean {
  // Das Stichwort muss am Wortanfang stehen ("kost" trifft "kostet", nicht "Gästeliste")
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ganz kurze Stichwörter ("ki", "abo") müssen ein ganzes Wort sein, sonst träfen sie "Kino" oder "Abort"
  const end = keyword.length <= 3 ? "($|[^\\p{L}\\p{N}])" : "";
  return new RegExp(`(^|[^\\p{L}])${escaped}${end}`, "iu").test(text);
}

function bestEntry(text: string): Entry | null {
  let best: { entry: Entry; score: number } | null = null;
  for (const entry of ENTRIES) {
    const score = entry.keywords.filter((k) => startsWith(text, k)).length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best?.entry ?? null;
}

/**
 * Prüft, ob eine Nachricht eine Frage an den Chat oder zu DSpora ist.
 * Gibt die Antwort zurück, oder null, wenn es eine ganz normale Antwort auf die Frage des Chats ist.
 */
export function answerSiteQuestion(raw: string): SiteAnswer | null {
  const text = raw.trim();
  if (!text) return null;

  const hasQuestionMark = text.includes("?");
  const interrogative = INTERROGATIVE.test(text);
  const addressed = ADDRESSED.test(text);
  const entry = bestEntry(text);

  // Ohne Fragezeichen nur dann eine Frage, wenn sie wie eine aussieht und zu einem bekannten Thema passt
  const isQuestion = hasQuestionMark ? interrogative || addressed : interrogative && entry !== null;
  if (!isQuestion) return null;

  return entry ? entry.answer : UNKNOWN;
}
