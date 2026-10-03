// Folgefragen zum Freitext im Pfad "Profil anlegen".
// Regelbasiert: Der Text wird nach Stichwörtern durchsucht, die Frage greift das gefundene Wort auf.
// Später lässt sich diese Funktion 1:1 durch einen KI-Aufruf ersetzen (gleiche Signatur).

type Topic = {
  id: string;
  /** Wortanfänge (kleingeschrieben), die das Thema erkennen lassen */
  keywords: string[];
  /** Fragen; {k} wird durch das gefundene Wort ersetzt */
  questions: string[];
};

const TOPICS: Topic[] = [
  {
    id: "sport",
    keywords: ["gym", "fitness", "sport", "training", "bouldern", "klettern", "lauf", "joggen", "fußball", "fussball", "kampfsport", "yoga", "schwimm"],
    questions: [
      "Du schreibst von „{k}“. Trainierst du lieber allein oder mit anderen, und was treibt dich dabei an?",
      "Bei „{k}“ gibt es oft ein Ziel dahinter. Woran arbeitest du gerade?",
    ],
  },
  {
    id: "gaming",
    keywords: ["gaming", "zock", "spiele", "videospiel", "playstation", "xbox", "konsole", "esport", "valorant", "fifa", "minecraft"],
    questions: [
      "„{k}“ ist ein weites Feld. Spielst du eher entspannt zum Abschalten oder ehrgeizig im Team?",
      "Welches Spiel bringt dich zuverlässig zum Strahlen, und mit wem würdest du es am liebsten spielen?",
    ],
  },
  {
    id: "studium",
    keywords: ["studium", "studier", "uni", "hochschule", "ausbildung", "azubi", "schule", "abitur", "master", "bachelor"],
    questions: [
      "Du erwähnst „{k}“. Was begeistert dich daran gerade am meisten, und was nervt dich eher?",
      "Wie sieht ein guter Ausgleich zum Lernen für dich aus?",
    ],
  },
  {
    id: "karriere",
    keywords: ["karriere", "beruf", "job", "arbeit", "firma", "startup", "gründ", "business", "selbstständig", "selbststaendig"],
    questions: [
      "Bei „{k}“: Was möchtest du beruflich in den nächsten Jahren erreichen?",
      "Würdest du dich gern mit Leuten austauschen, die ähnliche Ziele haben, oder lieber ganz weg vom Job-Thema?",
    ],
  },
  {
    id: "musik",
    keywords: ["musik", "song", "konzert", "gitarre", "klavier", "singen", "rap", "dj", "band", "playlist"],
    questions: [
      "Du schreibst von „{k}“. Welcher Song oder welche Art Musik beschreibt dich gerade am besten?",
      "Machst du selbst Musik, oder genießt du sie eher zusammen mit anderen?",
    ],
  },
  {
    id: "essen",
    keywords: ["koch", "essen", "restaurant", "food", "backen", "küche", "kueche", "kaffee", "café", "cafe"],
    questions: [
      "„{k}“ verbindet Menschen. Was ist dein Lieblingsgericht, und würdest du es gern mal für neue Leute kochen?",
      "Entdeckst du lieber neue Lokale oder bleibst du bei deinen Klassikern?",
    ],
  },
  {
    id: "reisen",
    keywords: ["reisen", "urlaub", "verreis", "backpack", "städtetrip", "staedtetrip", "ausland", "heimat", "sri lanka"],
    questions: [
      "Du erwähnst „{k}“. Wohin zieht es dich als Nächstes?",
      "Reist du lieber spontan oder gut geplant, und mit wem?",
    ],
  },
  {
    id: "kultur",
    keywords: ["kultur", "tradition", "tamil", "tanz", "bharatanatyam", "tempel", "sprache", "familie", "eltern", "wurzeln", "festival"],
    questions: [
      "Bei „{k}“: Welche Rolle spielt deine Herkunft in deinem Alltag, und wie gern würdest du sie mit anderen teilen?",
      "Was fehlt dir manchmal, wenn du außerhalb deiner Familie oder Community unterwegs bist?",
    ],
  },
  {
    id: "kreativ",
    keywords: ["kreativ", "malen", "zeichnen", "foto", "film", "video", "design", "kunst", "basteln", "content"],
    questions: [
      "Du schreibst von „{k}“. Woran arbeitest du gerade, und was würdest du gern mal gemeinsam umsetzen?",
      "Zeigst du deine Sachen gern anderen oder behältst du sie lieber für dich?",
    ],
  },
  {
    id: "neu",
    keywords: ["neu in", "neu hier", "umgezogen", "zugezogen", "einsam", "allein", "alleine", "keine freunde", "wenig freunde", "anschluss"],
    questions: [
      "Danke, dass du das ansprichst. Was würde dir den Start in einer neuen Umgebung am meisten erleichtern?",
      "Wie sieht für dich ein erstes Treffen aus, bei dem du dich wohlfühlst?",
    ],
  },
  {
    id: "ruhig",
    keywords: ["ruhig", "introvertiert", "schüchtern", "schuechtern", "zurückhaltend", "zurueckhaltend", "soziale batterie", "akku"],
    questions: [
      "Du beschreibst dich als „{k}“. Was brauchst du, damit du dich in einer Gruppe wohlfühlst?",
      "Wie viel Zeit mit anderen tut dir gut, bevor du Ruhe brauchst?",
    ],
  },
  {
    id: "humor",
    keywords: ["humor", "lachen", "witz", "spaß", "spass", "lustig", "meme"],
    questions: [
      "„{k}“ ist ein gutes Zeichen. Wann hast du zuletzt so richtig gelacht, und mit wem?",
      "Welcher Humor passt zu dir: trocken, albern oder eher tiefgründig?",
    ],
  },
  {
    id: "glaube",
    keywords: ["glaube", "religion", "spirit", "meditation", "achtsam", "werte"],
    questions: [
      "Du schreibst von „{k}“. Wie wichtig ist es dir, dass dein Gegenüber ähnliche Werte teilt?",
      "Worüber würdest du gern mal tiefer sprechen, ohne bewertet zu werden?",
    ],
  },
];

// Allgemeine Fragen, falls nichts Passendes im Text steht
const GENERIC = [
  "Was zeichnet für dich eine echte Freundschaft aus?",
  "Woran merkst du, dass dir jemand guttut?",
  "Was würdest du an einem freien Wochenende am liebsten mit neuen Leuten unternehmen?",
];

// Als String gebaut, da das Ziel-Target das u-Flag im Literal nicht erlaubt
const WORD = new RegExp("^[\\p{L}\\p{N}-]+", "u");

export type FollowUpQuestion = { topic: string; question: string };

export function pickFollowUps(text: string, max = 2): FollowUpQuestion[] {
  const found: { position: number; topic: Topic; word: string }[] = [];

  for (const topic of TOPICS) {
    let best: { position: number; word: string } | null = null;
    for (const keyword of topic.keywords) {
      // Das Stichwort muss am Wortanfang stehen ("uni" trifft "Uni", nicht "Gesundheit")
      const match = new RegExp(`(^|[^\\p{L}])(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "iu").exec(text);
      if (!match) continue;
      const index = match.index + match[1].length;
      // Wort vollständig übernehmen (z. B. "zocke" statt nur "zock")
      const word = keyword.includes(" ")
        ? text.slice(index, index + keyword.length)
        : (text.slice(index).match(WORD)?.[0] ?? keyword);
      if (!best || index < best.position) best = { position: index, word };
    }
    if (best) found.push({ ...best, topic });
  }

  found.sort((a, b) => a.position - b.position);

  const result: FollowUpQuestion[] = found.slice(0, max).map((f, i) => ({
    topic: f.topic.id,
    question: f.topic.questions[i % f.topic.questions.length].replace("{k}", f.word),
  }));

  // Mit allgemeinen Fragen auffüllen, damit es immer die gewünschte Anzahl gibt
  let g = 0;
  while (result.length < max) {
    result.push({ topic: "generic", question: GENERIC[g++ % GENERIC.length] });
  }
  return result;
}
