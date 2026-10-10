"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage, useTx } from "@/lib/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import { AgeInput, AgeRangeInput } from "@/components/onboarding/AgeForms";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import SingleChoice from "@/components/onboarding/SingleChoice";
import TermPicker from "@/components/onboarding/TermPicker";
import { Chip, ChipRow, LongTextAnswer, TextAnswer } from "@/components/onboarding/ui";
import { getBrowserClient } from "@/lib/supabase/client";
import { stashPhotos } from "@/lib/draftPhotos";
import { nextQuestion } from "@/lib/followups";
import { answerSiteQuestion, type ChatLink } from "@/lib/siteKnowledge";
import {
  FREE_FACT_QUESTION,
  buildSteckbrief,
  isRemoveRequest,
  isSteckbriefRequest,
  steckbriefText,
  type Steckbrief,
} from "@/lib/steckbrief";
import ReadyWindow, { type ReadyKind } from "@/components/onboarding/ReadyWindow";
import {
  DUO_WISHES,
  FOLLOW_UP_ANSWER_MAX,
  FREE_TEXT_MAX,
  GENDER_CHOICES,
  GOALS,
  GROUP_SIZES,
  GROUP_WISHES,
  INTERESTS,
  INTEREST_SUGGESTIONS,
  LANGUAGES,
  MAX_INTERESTS,
  MAX_TRANSCRIPT,
  MAX_VIBES,
  MEET_FREQUENCIES,
  MEET_MODES,
  MIN_INTERESTS,
  NAME_PATTERN,
  PHASES,
  ROLE_MAX,
  SECTORS,
  TRACKS,
  TRAVEL_OPTIONS,
  VIBES,
  VIBE_SUGGESTIONS,
  WISHES_MAX,
  choiceLabels,
  labelOf,
  type ChatTurn,
  type Choice,
  type OnboardingAnswers,
} from "@/lib/onboarding";

type Step =
  | "intro"
  | "track"
  | "groupSize"
  | "gender"
  | "matchGender"
  | "age"
  | "ageRange"
  | "meetMode"
  | "city"
  | "cityConfirm"
  | "travel"
  | "frequency"
  | "languages"
  | "lifePhase"
  | "sector"
  | "role"
  | "goals"
  | "interests"
  | "vibes"
  | "nickname"
  | "more"
  | "freeText"
  | "followUp"
  | "checkpoint"
  | "wishes"
  | "login"
  | "sent"
  | "retry";

type Message = { id: number; from: "bot" | "user"; text: string; link?: ChatLink };
// Eine Bot-Zeile: Text, optional mit Link darunter (z. B. zum Kontaktformular)
type BotLine = string | { text: string; link?: ChatLink };

const ACKNOWLEDGEMENTS = ["Danke dir!", "Das hilft mir sehr.", "Gut zu wissen.", "Schön, das zu hören.", "Verstehe, danke dir."];

const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const EMPTY: Choice = { ids: [], custom: [] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;

// Phase 1: alle Basisfragen sind Pflicht. Die Reihenfolge hängt von den Antworten ab (online/Aktivitäten, Friends/Business).
const TALK_STEPS: Step[] = ["more", "freeText", "followUp", "checkpoint"];
const FINALE_STEPS: Step[] = ["wishes", "login", "sent", "retry"];

// guest: noch nicht angemeldet, Anmeldung per Link am Ende | live: angemeldet, speichert direkt
// test: Admin-Testlauf, nichts wird gespeichert | preview: Supabase noch nicht verbunden
export type ChatMode = "guest" | "live" | "test" | "preview";

// Ersetzt die bisherigen Fotos des Nutzers durch die neuen (Ordner = eigene Nutzer-ID)
async function uploadPhotos(userId: string, blobs: Blob[]): Promise<boolean> {
  try {
    const storage = getBrowserClient().storage.from("profile-photos");
    const existing = await storage.list(userId);
    if (existing.data && existing.data.length > 0) {
      await storage.remove(existing.data.map((f: { name: string }) => `${userId}/${f.name}`));
    }
    for (let i = 0; i < blobs.length; i++) {
      const { error } = await storage.upload(`${userId}/photo-${i + 1}.jpg`, blobs[i], {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function OnboardingChat({
  mode = "preview",
  userId,
  resume,
  aiEnabled = false,
}: {
  mode?: ChatMode;
  userId?: string;
  /** Eingeloggte Person setzt das Gespräch fort: bereits Gefragtes wird nicht wiederholt */
  resume?: { asked: string[]; context: string; steckbrief: Steckbrief; track?: "community" | "business" };
  /** KI (OpenAI) stellt die Folgefragen; ohne Schlüssel oder bei Fehlern gilt die regelbasierte Frage */
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const tx = useTx();
  const { language, ready: languageReady } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState("");
  const [langs, setLangs] = useState<Choice>(EMPTY);
  const [wishKind, setWishKind] = useState<"duo" | "group">("duo");
  const [chosenGender, setChosenGender] = useState<string | undefined>();
  const [ready, setReady] = useState<{ kind: ReadyKind; email?: string } | null>(null);
  const [followQuestion, setFollowQuestion] = useState("");
  const [track, setTrack] = useState<"community" | "business">("community");
  const [ageNow, setAgeNow] = useState(25);
  const [chosenSector, setChosenSector] = useState<string | undefined>();
  const [goals, setGoals] = useState<Choice>(EMPTY);

  // Auswahlen, die in den Panels live bearbeitet werden
  const [interests, setInterests] = useState<Choice>(EMPTY);
  const [vibes, setVibes] = useState<Choice>(EMPTY);

  // Anmeldung am Ende
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const answers = useRef<Partial<OnboardingAnswers>>({});
  const photos = useRef<Blob[]>([]);
  const pendingPlace = useRef<{ name: string; lat: number; lng: number; hub: string; hubLabel: string } | null>(null);
  const business = useRef<{ sector?: string; role?: string; goals?: Choice }>({});
  const followAnswers = useRef<{ question: string; answer: string }[]>([]);
  // Chatverlauf (wird pro Konto gespeichert, für die Person selbst nicht sichtbar)
  const history = useRef<ChatTurn[]>([]);
  // Längeres Gespräch: schon gestellte Fragen, alles bisher Gesagte, Zähler für Zwischenfragen
  const askedQuestions = useRef<string[]>(resume?.asked ?? []);
  const talkContext = useRef<string>(resume?.context ?? "");
  const lastAnswer = useRef("");
  const sinceCheckpoint = useRef(0);
  const checkpointCount = useRef(0);
  const skipsInRow = useRef(0);
  const ackIndex = useRef(0);
  const nextId = useRef(0);
  const alive = useRef(true);
  const started = useRef(false);
  const shownAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, step, busy]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Bot-Nachrichten nacheinander einblenden, mit Tipp-Anzeige davor
  async function bot(lines: BotLine[]) {
    setBusy(true);
    for (const line of lines) {
      const message = typeof line === "string" ? { text: line } : line;
      setTyping(true);
      await sleep(650 + Math.min(message.text.length * 8, 850));
      if (!alive.current) return;
      setTyping(false);
      history.current.push({ role: "bot", text: message.text });
      setMessages((m) => [...m, { id: nextId.current++, from: "bot", ...message }]);
      await sleep(220);
    }
    if (alive.current) setBusy(false);
  }

  function user(message: string) {
    history.current.push({ role: "user", text: message });
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: message }]);
  }

  // Bot spricht, danach erscheint das Antwort-Panel des nächsten Schritts
  async function ask(texts: BotLine[], next: Step) {
    setStep("intro");
    setText("");
    setInputError("");
    await bot(texts);
    if (alive.current) setStep(next);
  }

  useEffect(() => {
    // Erst starten, wenn die gespeicherte Sprache gelesen wurde, damit die ersten Nachrichten gleich in der richtigen Sprache kommen
    if (!languageReady || started.current) return;
    started.current = true;
    if (resume) {
      ask(
        [
          tx("Schön, dass du wieder da bist! Was gibt es Neues bei dir? Erzähl mir gern, was sich geändert hat, oder frag mich nach deinem Steckbrief. Wenn du magst, stelle ich dir auch einfach weitere Fragen."),
        ],
        "freeText",
      );
      return;
    }
    ask(
      [
        tx("Willkommen bei DSpora. Lass uns herausfinden, wer wirklich zu dir passt, in deinem Tempo."),
        tx("Phase 1 sind ein paar kurze Fragen (etwa 2 Minuten), die alle beantwortet werden müssen, damit wir passende Leute für dich finden. Danach kannst du freiwillig mit mir weiterreden."),
        tx("Los geht's: Wonach suchst du bei DSpora?"),
      ],
      "track",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageReady]);

  // ——— Phase 1: Basisfragen (alle Pflicht) ———

  function pickTrack(next: "community" | "business") {
    answers.current.track = next;
    setTrack(next);
    user(tx(labelOf(next, TRACKS)));
    ask([tx("Perfekt! In welcher Gruppengröße möchtest du Leute treffen?")], "groupSize");
  }

  function pickGroupSize(value: string, label: string) {
    answers.current.groupSize = value;
    setWishKind(value === "duo" ? "duo" : "group");
    user(tx(label));
    ask([tx("Danke dir! Als was identifizierst du dich? Du kannst auch etwas Eigenes schreiben.")], "gender");
  }

  function pickGender(value: string, label: string) {
    if (!value) {
      setChosenGender(undefined);
      return;
    }
    answers.current.gender = value;
    setChosenGender(value);
    user(tx(label));
    ask(
      [
        wishKind === "duo"
          ? tx("Gut zu wissen! Welche Freundschaften suchst du?")
          : tx("Gut zu wissen! Welche Gruppe suchst du? Beantworte es so, wie es für dich passt."),
      ],
      "matchGender",
    );
  }

  function pickMatchGender(value: string, label: string) {
    const wishes = wishKind === "duo" ? DUO_WISHES : GROUP_WISHES;
    // Eigener Text (nicht in der Liste) heißt "Anderes"
    answers.current.matchGender = wishes.some((w) => w.id === value) ? value : "other";
    user(tx(label));
    ask([tx("Wie alt bist du?")], "age");
  }

  function submitAge(age: number) {
    answers.current.age = age;
    setAgeNow(age);
    user(String(age));
    ask([tx("Und welche Altersspanne passt dir bei den anderen? Du kannst die Zahlen anpassen.")], "ageRange");
  }

  function submitAgeRange(min: number, max: number) {
    answers.current.ageMin = min;
    answers.current.ageMax = max;
    user(tx("{min} bis {max} Jahre", { min, max }));
    ask([tx("Wie soll die Freundschaft aussehen?")], "meetMode");
  }

  function pickMeetMode(value: string, label: string) {
    answers.current.meetMode = value as "online" | "activities";
    user(tx(label));
    if (value === "online") {
      answers.current.region = "online";
      answers.current.travelMinutes = null;
      askLanguages();
      return;
    }
    ask([tx("In welcher Stadt wohnst du? Ich ordne dich dann dem nächsten Hub zu.")], "city");
  }

  async function submitCity() {
    const value = text.trim();
    if (value.length < 2) {
      setInputError(tx("Bitte gib deinen Wohnort an."));
      return;
    }
    user(value);
    setStep("intro");
    setBusy(true);
    setTyping(true);
    let place: { name: string; lat: number; lng: number; hub: string; hubLabel: string } | null = null;
    try {
      const res = await fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      place = data?.place ?? null;
    } catch {
      place = null;
    }
    if (!alive.current) return;
    setTyping(false);
    if (!place) {
      await ask([tx("Diesen Ort konnte ich leider nicht zuordnen. Bitte gib die nächstgrößere Stadt in deiner Nähe ein.")], "city");
      return;
    }
    pendingPlace.current = place;
    await ask(
      [
        place.hub === "warteliste"
          ? tx("Ich habe „{name}“ gefunden. In deiner Nähe gibt es noch keinen Hub. Du kommst auf die Warteliste, und wir melden uns, sobald es einen gibt. Passt das so?", { name: place.name })
          : tx("Ich habe „{name}“ gefunden und ordne dich dem Hub {hub} zu. Passt das?", { name: place.name, hub: tx(place.hubLabel) }),
      ],
      "cityConfirm",
    );
  }

  function confirmCity(yes: boolean) {
    const place = pendingPlace.current;
    if (!yes || !place) {
      user(tx("Anderen Ort eingeben"));
      ask([tx("Kein Problem. Welcher Ort passt besser?")], "city");
      return;
    }
    answers.current.city = place.name;
    answers.current.lat = place.lat;
    answers.current.lng = place.lng;
    answers.current.region = place.hub;
    user(tx("Ja, passt"));
    ask([tx("Wie weit darf jemand maximal von dir entfernt wohnen? Gemeint ist die Fahrzeit mit dem Auto.")], "travel");
  }

  function pickTravel(minutes: number, label: string) {
    answers.current.travelMinutes = minutes === 0 ? null : minutes;
    user(tx(label));
    ask([tx("Wie oft würdest du dich realistisch mit jemandem treffen?")], "frequency");
  }

  function pickFrequency(value: string, label: string) {
    extras().meetFrequency = value;
    user(tx(label));
    askLanguages();
  }

  function askLanguages() {
    ask([tx("Welche Sprachen sprichst du gern mit Freunden? Du kannst mehrere wählen oder eigene eintragen.")], "languages");
  }

  function confirmLanguages(chosen: Choice) {
    answers.current.languages = chosen;
    user(choiceLabels(chosen, LANGUAGES).map((l) => tx(l)).join(", "));
    if (track === "business") {
      ask([tx("Spannend! In welcher Branche oder welchem Sektor bist du unterwegs?")], "sector");
    } else {
      ask([tx("Wo stehst du gerade im Leben?")], "lifePhase");
    }
  }

  function pickPhase(value: string, label: string) {
    answers.current.lifePhase = value;
    user(tx(label));
    askInterests();
  }

  function pickSector(value: string, label: string) {
    if (!value) {
      setChosenSector(undefined);
      return;
    }
    business.current.sector = value;
    setChosenSector(value);
    user(tx(label));
    ask([tx("Und was ist deine aktuelle berufliche Rolle?")], "role");
  }

  function submitRole() {
    const value = text.trim();
    if (value.length < 2) {
      setInputError(tx("Bitte gib deine Rolle an (mindestens 2 Zeichen)."));
      return;
    }
    business.current.role = value;
    user(value);
    ask([tx("Was ist dein Hauptziel bei DSpora? Wähle bis zu drei oder schreib dein eigenes.")], "goals");
  }

  function confirmGoals(chosen: Choice) {
    business.current.goals = chosen;
    answers.current.business = {
      sector: business.current.sector as string,
      role: business.current.role as string,
      goals: chosen,
      cv: { achievements: [], links: [] },
    };
    user(choiceLabels(chosen, GOALS).map((l) => tx(l)).join(", "));
    askInterests();
  }

  function askInterests() {
    ask(
      [
        track === "business"
          ? tx("Was begeistert dich abseits der Arbeit? Gemeinsame Aktivitäten wie Tennis oder Padel verbinden oft am meisten. Tippe einen Vorschlag an oder schreib eigene Wörter.")
          : tx("Was begeistert dich? Tippe einen Vorschlag an oder schreib eigene Wörter in die Felder."),
      ],
      "interests",
    );
  }

  function confirmInterests(chosen: Choice) {
    answers.current.interests = chosen;
    user(choiceLabels(chosen, INTERESTS).map((l) => tx(l)).join(", "));
    ask([tx("Und welcher Vibe beschreibt dich am besten? Auch hier gern eigene Wörter.")], "vibes");
  }

  function confirmVibes(chosen: Choice) {
    answers.current.vibes = chosen;
    user(choiceLabels(chosen, VIBES).map((l) => tx(l)).join(", "));
    ask(
      [
        tx("Fast geschafft! Wie sollen wir dich nennen? Ein Spitzname oder Künstlername reicht, so kannst du anonym bleiben. Deinen echten Namen kannst du später im Profil ergänzen."),
      ],
      "nickname",
    );
  }

  function submitNickname() {
    const value = text.trim();
    if (!NAME_PATTERN.test(value)) {
      setInputError(tx("2 bis 24 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen."));
      return;
    }
    answers.current.mode = "profile";
    answers.current.profile = {
      displayName: value,
      age: answers.current.age,
      hobbies: [],
      languages: answers.current.languages ?? EMPTY,
      phase: answers.current.lifePhase,
      visibility: "stealth",
      photoCount: 0,
    };
    user(value);
    ask(
      [
        tx("Das war Phase 1, danke dir! Möchtest du mir in Phase 2 noch mehr von dir erzählen? Das ist freiwillig. Ich stelle dir dann passende, tiefere Fragen, damit die Matches noch besser passen."),
      ],
      "more",
    );
  }

  function pickMore(wantsChat: boolean) {
    if (!wantsChat) {
      user(tx("Nein, weiter"));
      toWishes();
      return;
    }
    user(tx("Ja, gern"));
    ask(
      [
        tx("Schön! Erzähl frei heraus, was dir wichtig ist, wer du bist oder wonach du suchst. Auch was du nicht magst, hilft mir. Wir können so lange reden, wie du magst, und wenn du Fragen zu DSpora hast, stell sie mir gern zwischendurch."),
        ...(aiEnabled
          ? [tx("Hinweis: Für die Folgefragen hilft mir eine KI (OpenAI), für die Auswertung am Ende eine weitere (Claude von Anthropic). E-Mail-Adressen, Telefonnummern und Links werden vorher entfernt.")]
          : []),
      ],
      "freeText",
    );
  }

  function toWishes(intro: BotLine[] = []) {
    ask(
      [
        ...intro,
        tx("Zum Abschluss habe ich noch eine Bitte an dich: Was wünschst du dir von DSpora? Welche Features oder Ideen sollten wir unbedingt einbauen?"),
      ],
      "wishes",
    );
  }

  // ——— Freitext und Folgefragen (optional, vor der Weiche), danach das Profil ———

  function extras() {
    answers.current.extras = answers.current.extras ?? {};
    return answers.current.extras;
  }

  // Fragt eine Person zwischendurch etwas zu DSpora, antwortet der Chat anhand der Webseiten-Infos
  // (nichts Erfundenes, sonst Hinweis auf das Kontaktformular) und stellt dann dieselbe Frage noch einmal.
  function tryAnswerSiteQuestion(value: string, question: string, backTo: Step): boolean {
    // Der Steckbrief: Wie sehe ich aktuell aus? Anpassen ist im Profil und im Gespräch jederzeit möglich.
    if (isSteckbriefRequest(value)) {
      user(value);
      ask(
        [
          { text: steckbriefText(currentSteckbrief(), tx) },
          loggedIn
            ? {
                text: tx("Wenn etwas nicht mehr stimmt, erzähl mir hier einfach den neuen Stand. Einzelne Angaben kannst du in deinem Profil auch selbst entfernen."),
                link: { href: "/dashboard", label: tx("Steckbrief im Profil") },
              }
            : tx("Nach der Anmeldung kannst du alles jederzeit in deinem Profil anpassen und mir im Gespräch Neues erzählen."),
          tx("Aber zurück zu dir: {question}", { question }),
        ],
        backTo,
      );
      return true;
    }
    // Etwas vergessen/entfernen: das geschieht bewusst sichtbar im Profil, nicht heimlich im Gespräch
    if (isRemoveRequest(value)) {
      user(value);
      ask(
        [
          loggedIn
            ? {
                text: tx("Einzelne Angaben entfernst du in deinem Profil unter „Dein Steckbrief“ mit dem ×. Dann sind sie auch wirklich weg. Wenn sich etwas geändert hat, erzähl mir hier gern den neuen Stand."),
                link: { href: "/dashboard", label: tx("Zum Steckbrief") },
              }
            : tx("Nach der Anmeldung kannst du in deinem Profil unter „Dein Steckbrief“ jede Angabe mit dem × entfernen. Wenn sich etwas geändert hat, erzähl mir gern den neuen Stand."),
          tx("Aber zurück zu dir: {question}", { question }),
        ],
        backTo,
      );
      return true;
    }
    const reply = answerSiteQuestion(value);
    if (!reply) return false;
    user(value);
    ask([{ text: tx(reply.text), link: reply.link ? { href: reply.link.href, label: tx(reply.link.label) } : undefined }, tx("Aber zurück zu dir: {question}", { question })], backTo);
    return true;
  }

  // Angemeldet: der Chat kennt den gespeicherten Steckbrief. Gast: er entsteht aus den bisherigen Antworten.
  const loggedIn = mode === "live" || mode === "test";
  function currentSteckbrief(): Steckbrief {
    if (resume) {
      return {
        lines: resume.steckbrief.lines,
        facts: [
          ...resume.steckbrief.facts,
          ...followAnswers.current.map((f) => ({ kind: "follow" as const, question: f.question, answer: f.answer })),
        ],
      };
    }
    const a = answers.current;
    return buildSteckbrief({
      gender: a.gender,
      matchGender: a.matchGender,
      groupSize: a.groupSize,
      region: a.region,
      secondRegion: a.secondRegion,
      city: a.city,
      age: a.age,
      ageMin: a.ageMin,
      ageMax: a.ageMax,
      meetMode: a.meetMode,
      travelMinutes: a.travelMinutes,
      languages: a.languages,
      lifePhase: a.lifePhase,
      interests: a.interests,
      vibes: a.vibes,
      track: a.track,
      business: a.business,
      extras: { ...a.extras, followUps: followAnswers.current },
    });
  }

  function submitFreeText(skip = false) {
    const value = text.trim();
    if (
      !skip &&
      value &&
      tryAnswerSiteQuestion(value, tx("Erzähl mir gern, was dir wichtig ist, wer du bist oder wonach du suchst."), "freeText")
    ) {
      return;
    }
    const answered = !skip && Boolean(value);
    if (resume) {
      // Fortgesetztes Gespräch: Neues wird als Angabe im Steckbrief gemerkt
      user(answered ? value : tx("Frag du mich"));
      if (answered) {
        followAnswers.current.push({ question: tx("Das hast du mir mitgeteilt"), answer: value });
        talkContext.current += ` ${value}`;
        lastAnswer.current = value;
        sinceCheckpoint.current += 1;
      }
      askNext(answered ? [tx("Danke, das merke ich mir.")] : []);
      return;
    }
    extras().freeText = answered ? value : undefined;
    user(answered ? value : tx("Überspringen"));
    followAnswers.current = [];
    if (answered) {
      talkContext.current += ` ${value}`;
      lastAnswer.current = value;
      sinceCheckpoint.current += 1;
    }
    askNext(answered ? [tx("Danke, das erzählt schon viel über dich.")] : []);
  }

  // Frage der KI holen (bereinigt, ohne Geschlecht). Bei Fehler oder Zeitüberschreitung null: dann gilt die regelbasierte Frage.
  async function fetchAiQuestion(): Promise<string | null> {
    if (!aiEnabled) return null;
    try {
      const sb = currentSteckbrief();
      const hints = sb.lines
        .filter((l) => !["Geschlecht", "Verbinden mit", "Alter", "Gesuchtes Alter"].includes(l.label))
        .map((l) => `${l.label}: ${l.value}`)
        .slice(0, 10);
      const recent = [
        ...(resume?.steckbrief.facts ?? []).map((f) => f.answer),
        ...(extrasText() ? [extrasText()] : []),
        ...followAnswers.current.map((f) => f.answer),
      ].slice(-6);
      const res = await fetch("/api/chat/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastAnswer: lastAnswer.current, recent, asked: askedQuestions.current.slice(-40), hints, track: resume?.track ?? track, language }),
        signal: AbortSignal.timeout(9000),
      });
      const data = await res.json();
      return typeof data?.question === "string" ? data.question : null;
    } catch {
      return null;
    }
  }

  function extrasText(): string {
    return answers.current.extras?.freeText ?? "";
  }

  // Nächste Frage im Gespräch. Nach jeweils drei Antworten fragt der Chat, ob es weitergehen soll.
  async function askNext(intro: BotLine[] = []) {
    if (sinceCheckpoint.current >= 3 || skipsInRow.current >= 2) {
      sinceCheckpoint.current = 0;
      skipsInRow.current = 0;
      askCheckpoint(intro);
      return;
    }
    let question: string | null = null;
    if (aiEnabled) {
      setStep("intro");
      setBusy(true);
      setTyping(true);
      question = await fetchAiQuestion();
      if (!alive.current) return;
      setTyping(false);
      if (question && askedQuestions.current.includes(question)) question = null;
    }
    if (!question) question = nextQuestion(lastAnswer.current, talkContext.current, askedQuestions.current, language);
    if (!question) {
      exitTalk([...intro, tx("Ich glaube, ich habe dich jetzt schon richtig gut kennengelernt. Danke dir!")]);
      return;
    }
    askedQuestions.current.push(question);
    setFollowQuestion(question);
    ask([...intro, question], "followUp");
  }

  function submitFollowUp(skip = false) {
    const value = text.trim();
    if (!skip && value && tryAnswerSiteQuestion(value, followQuestion, "followUp")) return;
    if (skip || !value) {
      user(tx("Überspringen"));
      skipsInRow.current += 1;
      askNext([tx("Kein Problem, dann etwas anderes:")]);
      return;
    }
    skipsInRow.current = 0;
    followAnswers.current.push({ question: followQuestion, answer: value });
    if (!resume) extras().followUps = followAnswers.current.slice();
    talkContext.current += ` ${value}`;
    lastAnswer.current = value;
    sinceCheckpoint.current += 1;
    user(value);
    askNext(sinceCheckpoint.current >= 3 ? [] : [tx(ACKNOWLEDGEMENTS[ackIndex.current++ % ACKNOWLEDGEMENTS.length])]);
  }

  function askCheckpoint(intro: BotLine[] = []) {
    const first = checkpointCount.current++ === 0;
    ask(
      [
        ...intro,
        first
          ? tx("Das war schon richtig spannend! Möchtest du noch weiter erzählen, oder sollen wir das Gespräch später fortsetzen? Wir können gern noch länger reden.")
          : tx("Ich lerne dich gerade richtig gut kennen. Weiter erzählen, oder sollen wir später weitermachen?"),
      ],
      "checkpoint",
    );
  }

  function pickCheckpoint(more: boolean) {
    if (more) {
      user(tx("Gern, weiter erzählen"));
      askNext([tx("Super, dann weiter!")]);
      return;
    }
    user(tx("Später fortsetzen"));
    exitTalk([tx("Alles klar, wir setzen das Gespräch später fort. Du findest es dann in deinem Profil.")]);
  }

  // Gespräch beenden: neu angemeldet geht es mit den Wünschen weiter, beim Fortsetzen werden die neuen Antworten gespeichert.
  function exitTalk(intro: BotLine[] = []) {
    if (resume) {
      finishResume(intro);
      return;
    }
    toWishes(intro);
  }

  async function finishResume(intro: BotLine[] = []) {
    setStep("intro");
    await bot([...intro, tx("Einen Moment, ich speichere deine Antworten …")]);
    if (!alive.current) return;
    setBusy(true);
    setTyping(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talk: { followUps: followAnswers.current, transcript: history.current.slice(-MAX_TRANSCRIPT) } }),
      });
      if (!res.ok) throw new Error("save failed");
      setTyping(false);
      setBusy(false);
      setReady({ kind: "resume" });
    } catch {
      setTyping(false);
      await bot([tx("Das hat leider nicht geklappt. Magst du es noch einmal versuchen?")]);
      setStep("retry");
    }
  }

  // ——— Finale: Wünsche, dann Anmeldung/Speichern ———

  function submitWishes(skip = false) {
    const value = text.trim();
    extras().wishes = skip || !value ? undefined : value;
    user(skip || !value ? tx("Überspringen") : value);
    toAuth();
  }

  function toAuth() {
    if (mode === "guest") {
      shownAt.current = Date.now();
      ask(
        [
          tx("Fast geschafft! Zum Schluss bestätigst du deine E-Mail-Adresse. Ich schicke dir einen Link, mit dem du dich anmeldest und dein Profil gespeichert wird."),
        ],
        "login",
      );
      return;
    }
    finishSave();
  }

  // Angemeldet (live), Admin-Test oder Vorschau: Antworten direkt senden
  async function finishSave() {
    setStep("intro");
    await bot([tx("Perfekt, danke dir! Einen Moment, ich lege dein Profil an …")]);
    if (!alive.current) return;
    setBusy(true);
    setTyping(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers.current,
            transcript: history.current.slice(-MAX_TRANSCRIPT),
            test: mode === "test" ? true : undefined,
          }),
        }),
        sleep(900),
      ]);
      if (!res.ok) throw new Error("save failed");

      let photosFailed = false;
      if (mode === "live" && userId && photos.current.length > 0) {
        photosFailed = !(await uploadPhotos(userId, photos.current));
      }
      setTyping(false);
      if (photosFailed) {
        await bot([tx("Deine Antworten sind gespeichert, nur die Fotos konnten leider nicht hochgeladen werden.")]);
      }
      if (mode === "test") {
        await bot([tx("Du bist startklar!")]);
        await sleep(600);
        if (alive.current) router.push("/admin");
        return;
      }
      setBusy(false);
      if (alive.current) setReady({ kind: "member" });
    } catch {
      setTyping(false);
      await bot([tx("Das hat leider nicht geklappt. Magst du es noch einmal versuchen?")]);
      setStep("retry");
    }
  }

  // Gast: Link anfordern. Die Antworten gehen als Entwurf mit und werden nach dem Klick übernommen.
  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending) return;
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) {
      setLoginError(tx("Bitte gib eine gültige E-Mail-Adresse ein."));
      return;
    }
    setLoginError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - shownAt.current,
          draft: answers.current,
          transcript: history.current.slice(-MAX_TRANSCRIPT),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLoginError(data?.error ?? tx("Das hat leider nicht geklappt. Bitte versuch es noch einmal."));
        return;
      }
      await stashPhotos(photos.current);
      user(value);
      setCooldown(RESEND_SECONDS);
      await ask(
        [
          tx("Check dein Postfach: Ich habe dir einen Link an {value} geschickt. Mit einem Klick bist du drin, ganz ohne Passwort.", { value }),
          tx("Schau auch im Spam-Ordner nach, falls nichts ankommt."),
        ],
        "sent",
      );
      if (alive.current) setReady({ kind: "guest", email: value });
    } catch {
      setLoginError(tx("Keine Verbindung. Bitte versuch es noch einmal."));
    } finally {
      setSending(false);
    }
  }

  // Reihenfolge der Phase-1-Fragen für die Fortschrittsanzeige (hängt von den bisherigen Antworten ab)
  const phase1: Step[] = [
    "track",
    "groupSize",
    "gender",
    "matchGender",
    "age",
    "ageRange",
    "meetMode",
    ...(answers.current.meetMode === "online" ? [] : (["city", "travel", "frequency"] as Step[])),
    "languages",
    ...(track === "business" ? (["sector", "role", "goals"] as Step[]) : (["lifePhase"] as Step[])),
    "interests",
    "vibes",
    "nickname",
  ];
  const phase1Step: Step = step === "cityConfirm" ? "city" : step;
  const questionIndex = phase1.indexOf(phase1Step);
  const inTalk = TALK_STEPS.includes(step);
  const inFinale = FINALE_STEPS.includes(step);
  const showPanel = !busy && step !== "intro";
  const progress = resume ? 0 : inFinale ? 1 : inTalk ? 0.9 : questionIndex >= 0 ? (questionIndex + 1) / (phase1.length + 1) : 0;
  const headerLabel = resume
    ? tx("Gespräch")
    : inFinale
      ? tx("Finale")
      : inTalk
        ? tx("Phase 2")
        : questionIndex >= 0
          ? tx("Frage {i} / {n}", { i: questionIndex + 1, n: phase1.length })
          : "";

  return (
    <div className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-zinc-950 sm:p-6">
      <FlowingWaveBackground pulses={false} />
      <div className="relative flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden border-white/10 bg-zinc-950/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md sm:h-[min(780px,calc(100dvh-3rem))] sm:rounded-3xl sm:border">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />

        {/* Kopfzeile */}
        <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            href={mode === "test" ? "/admin" : "/"}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {tx("← Zurück")}
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(242,166,90,0.9)]" />
            DSpora
            {mode === "test" && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-gold normal-case">
                {tx("Testmodus")}
              </span>
            )}
          </div>
          <span className="w-24 text-right text-xs text-zinc-500">{headerLabel}</span>
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/5">
            <motion.div
              className="h-full bg-gold/70"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        </header>

        {/* Sprache (immer Deutsch, தமிழ், English) */}
        <div className="relative flex justify-center border-b border-white/5 py-1.5">
          <LanguageSwitch className="scale-90" />
        </div>

        {/* Verlauf */}
        <div
          className="relative flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6"
          role="log"
          aria-live="polite"
          aria-label="Onboarding-Chat"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout="position"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    message.from === "bot"
                      ? "max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_26px_-12px_rgba(242,166,90,0.45)] backdrop-blur-xl"
                      : "max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-sm leading-relaxed font-medium break-words text-zinc-950 shadow-[0_8px_20px_-10px_rgba(242,166,90,0.5)]"
                  }
                >
                  {message.text}
                  {message.link && (
                    <Link
                      href={message.link.href}
                      className="mt-2.5 inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
                    >
                      {message.link.label}
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}

            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex justify-start"
                aria-label={tx("DSpora schreibt")}
              >
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-xl">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-gold"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* Antwortbereich */}
        <div className="relative max-h-[62%] min-h-[88px] overflow-y-auto border-t border-white/10 bg-zinc-950/30 px-4 py-4 sm:px-6">
          <AnimatePresence mode="wait" initial={false}>
            {showPanel && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {step === "track" && (
                  <ChipRow>
                    {TRACKS.map((t) => (
                      <Chip key={t.id} onClick={() => pickTrack(t.id as "community" | "business")}>
                        {tx(t.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "groupSize" && (
                  <ChipRow>
                    {GROUP_SIZES.map((g) => (
                      <Chip key={g.id} onClick={() => pickGroupSize(g.id, g.label)}>
                        {tx(g.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "gender" && (
                  <SingleChoice
                    options={GENDER_CHOICES}
                    value={chosenGender}
                    onSelect={pickGender}
                    customPlaceholder={tx("Anderes: schreib es selbst")}
                  />
                )}

                {step === "matchGender" && (
                  <SingleChoice
                    options={wishKind === "duo" ? DUO_WISHES : GROUP_WISHES}
                    onSelect={pickMatchGender}
                    customPlaceholder={tx("Anderes: schreib es selbst")}
                  />
                )}

                {step === "age" && <AgeInput onSubmit={submitAge} />}

                {step === "ageRange" && <AgeRangeInput age={ageNow} onSubmit={submitAgeRange} />}

                {step === "meetMode" && (
                  <ChipRow>
                    {MEET_MODES.map((m) => (
                      <Chip key={m.id} onClick={() => pickMeetMode(m.id, m.label)}>
                        {tx(m.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "city" && (
                  <TextAnswer
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={() => submitCity()}
                    placeholder={tx("Dein Wohnort")}
                    error={inputError}
                  />
                )}

                {step === "cityConfirm" && (
                  <ChipRow>
                    <Chip onClick={() => confirmCity(true)}>{tx("Ja, passt")}</Chip>
                    <Chip onClick={() => confirmCity(false)} subtle>
                      {tx("Anderen Ort eingeben")}
                    </Chip>
                  </ChipRow>
                )}

                {step === "travel" && (
                  <ChipRow>
                    {TRAVEL_OPTIONS.map((o) => (
                      <Chip key={o.minutes} onClick={() => pickTravel(o.minutes, o.label)}>
                        {tx(o.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "frequency" && (
                  <ChipRow>
                    {MEET_FREQUENCIES.map((f) => (
                      <Chip key={f.id} onClick={() => pickFrequency(f.id, f.label)}>
                        {tx(f.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "languages" && (
                  <ChoiceSelect
                    options={LANGUAGES}
                    value={langs}
                    onChange={setLangs}
                    onConfirm={confirmLanguages}
                    maxTotal={5}
                    customPlaceholder={tx("Eine andere Sprache? Eigene hinzufügen")}
                  />
                )}

                {step === "lifePhase" && (
                  <SingleChoice options={PHASES} onSelect={pickPhase} customPlaceholder={tx("Etwas anderes? Eigene Angabe")} />
                )}

                {step === "sector" && (
                  <SingleChoice
                    options={SECTORS}
                    value={chosenSector}
                    onSelect={pickSector}
                    customPlaceholder={tx("Andere Branche? Eigene Angabe")}
                  />
                )}

                {step === "role" && (
                  <TextAnswer
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={submitRole}
                    placeholder={tx("z. B. Gründerin, Product Manager, Entwickler")}
                    maxLength={ROLE_MAX}
                    error={inputError}
                  />
                )}

                {step === "goals" && (
                  <ChoiceSelect
                    options={GOALS}
                    value={goals}
                    onChange={setGoals}
                    onConfirm={confirmGoals}
                    customPlaceholder={tx("Ein anderes Ziel? Eigenes hinzufügen")}
                    maxTotal={3}
                  />
                )}

                {step === "interests" && (
                  <TermPicker
                    key="interests"
                    suggestions={INTEREST_SUGGESTIONS[track].map((id) => INTERESTS.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => Boolean(o))}
                    allOptions={INTERESTS}
                    max={MAX_INTERESTS}
                    min={MIN_INTERESTS}
                    placeholder={(i) => [tx("z. B. Tennis"), tx("z. B. Padel"), tx("z. B. Kochen"), tx("z. B. Fotografie"), tx("z. B. Anime"), tx("z. B. Wandern"), tx("z. B. Bouldern"), tx("z. B. Podcasts")][i] ?? tx("Eigener Begriff")}
                    hint={tx("Bis zu 5 insgesamt. Ähnliche Wörter erkenne ich selbst, du musst nicht dasselbe tippen wie andere.")}
                    onConfirm={confirmInterests}
                  />
                )}

                {step === "vibes" && (
                  <TermPicker
                    key="vibes"
                    suggestions={VIBE_SUGGESTIONS[track].map((id) => VIBES.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => Boolean(o))}
                    allOptions={VIBES}
                    max={MAX_VIBES}
                    min={1}
                    placeholder={(i) => [tx("z. B. Ehrlich"), tx("z. B. Neugierig"), tx("z. B. Herzlich"), tx("z. B. Ruhig"), tx("z. B. Offen"), tx("z. B. Ehrgeizig"), tx("z. B. Gelassen"), tx("z. B. Verspielt")][i] ?? tx("Eigener Begriff")}
                    hint={tx("Bis zu 5 insgesamt.")}
                    onConfirm={confirmVibes}
                  />
                )}

                {step === "nickname" && (
                  <TextAnswer
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={submitNickname}
                    placeholder={tx("Dein Spitzname oder Künstlername")}
                    maxLength={24}
                    error={inputError}
                  />
                )}

                {step === "more" && (
                  <ChipRow>
                    <Chip onClick={() => pickMore(true)}>{tx("Ja, gern")}</Chip>
                    <Chip onClick={() => pickMore(false)} subtle>
                      {tx("Nein, weiter")}
                    </Chip>
                  </ChipRow>
                )}

                {step === "freeText" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitFreeText()}
                    placeholder={tx("Erzähl frei heraus, was dir wichtig ist, wer du bist oder wonach du suchst …")}
                    maxLength={FREE_TEXT_MAX}
                    minLength={10}
                    rows={5}
                    skipLabel={resume ? tx("Frag du mich") : tx("Überspringen")}
                    onSkip={() => submitFreeText(true)}
                  />
                )}

                {step === "followUp" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitFollowUp()}
                    placeholder={tx("Deine Antwort …")}
                    maxLength={FOLLOW_UP_ANSWER_MAX}
                    minLength={2}
                    onSkip={() => submitFollowUp(true)}
                  />
                )}

                {step === "checkpoint" && (
                  <ChipRow>
                    <Chip onClick={() => pickCheckpoint(true)}>{tx("Gern, weiter erzählen")}</Chip>
                    <Chip onClick={() => pickCheckpoint(false)} subtle>
                      {tx("Später fortsetzen")}
                    </Chip>
                  </ChipRow>
                )}

                {step === "wishes" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitWishes()}
                    placeholder={tx("Meine Wünsche und Ideen für DSpora …")}
                    maxLength={WISHES_MAX}
                    minLength={3}
                    rows={5}
                    onSkip={() => submitWishes(true)}
                  />
                )}

                {step === "login" && (
                  <form onSubmit={sendLink} className="space-y-2.5">
                    <input
                      ref={honeypot}
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="pointer-events-none absolute h-0 w-0 opacity-0"
                    />
                    <label htmlFor="chat-email" className="sr-only">
                      {tx("E-Mail-Adresse")}
                    </label>
                    <input
                      id="chat-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLoginError("");
                      }}
                      placeholder={tx("deine@mail.com")}
                      aria-invalid={loginError ? true : undefined}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-center text-sm text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
                    />
                    {loginError && (
                      <p role="alert" className="px-1 text-center text-xs text-rose">
                        {loginError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={sending || !email.trim()}
                      className="cta-premium w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-50"
                    >
                      {sending ? tx("Sende …") : tx("Jetzt anmelden & Profil speichern")}
                    </button>
                    <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-500">
                      {tx("Kein Passwort nötig. Deine E-Mail-Adresse bleibt für andere unsichtbar.")}
                    </p>
                  </form>
                )}

                {step === "sent" && (
                  <ChipRow>
                    <Chip
                      onClick={() => {
                        setStep("login");
                        shownAt.current = Date.now() - 2000;
                      }}
                      subtle={cooldown > 0}
                    >
                      {cooldown > 0
                        ? tx("Andere Adresse oder erneut senden (in {n} s)", { n: cooldown })
                        : tx("Link erneut senden / andere Adresse")}
                    </Chip>
                  </ChipRow>
                )}

                {step === "retry" && (
                  <ChipRow>
                    <Chip onClick={() => (resume ? finishResume() : finishSave())}>{tx("Erneut versuchen")}</Chip>
                  </ChipRow>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {ready && (
        <ReadyWindow
          kind={ready.kind}
          email={ready.email}
          onResend={
            ready.kind === "guest"
              ? () => {
                  setReady(null);
                  setStep("login");
                  shownAt.current = Date.now() - 2000;
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
