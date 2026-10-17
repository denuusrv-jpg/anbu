"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { scrollFieldIntoView } from "@/lib/scrollIntoViewOnFocus";
import { useLanguage, useTx } from "@/lib/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import { AgeInput, AgeRangeInput } from "@/components/onboarding/AgeForms";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import SingleChoice from "@/components/onboarding/SingleChoice";
import TermPicker from "@/components/onboarding/TermPicker";
import { BigChoices, Chip, ChipRow, LongTextAnswer, TextAnswer } from "@/components/onboarding/ui";
import ConsentCheckbox from "@/components/ConsentCheckbox";
import { CheckIcon, ShieldIcon } from "@/components/Icons";
import { getBrowserClient } from "@/lib/supabase/client";
import { stashPhotos } from "@/lib/draftPhotos";
import { nextQuestion } from "@/lib/followups";
import type { ChatLink } from "@/lib/siteKnowledge";
import { translateUi } from "@/lib/uiText";
import {
  FREE_FACT_QUESTION,
  buildSteckbrief,
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
  | "transition"
  | "talkMode"
  | "talk"
  | "wishes"
  | "login"
  | "sent"
  | "retry";

type Message = { id: number; from: "bot" | "user"; text: string; link?: ChatLink };
// Eine Bot-Zeile: Text, optional mit Link darunter (z. B. zum Kontaktformular)
type BotLine = string | { text: string; link?: ChatLink };

const MARK = "\u0002";

const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const EMPTY: Choice = { ids: [], custom: [] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;

// Phase 1: alle Basisfragen sind Pflicht. Die Reihenfolge hängt von den Antworten ab (online/Aktivitäten, Friends/Business).
const TALK_STEPS: Step[] = ["talkMode", "talk"];
const FINALE_STEPS: Step[] = ["wishes", "login", "sent", "retry"];

// Phase 1 läuft als Karten-Ablauf (eine Frage pro Bildschirm, keine Chat-Blasen), das Gespräch danach als Chat.
type View = "cards" | "chat";
const BACK_STEPS: Step[] = [
  "track", "groupSize", "gender", "matchGender", "age", "ageRange", "meetMode", "city", "cityConfirm", "travel",
  "frequency", "languages", "lifePhase", "sector", "role", "goals", "interests", "vibes", "nickname", "transition",
];
const CARD_STEPS: Step[] = [...BACK_STEPS, "login", "sent"];
const BIG_STEPS: Step[] = ["track", "groupSize", "gender", "matchGender", "meetMode", "cityConfirm", "travel", "frequency", "lifePhase", "sector"];
const LEAD_BELOW: Step[] = ["transition", "login", "sent"];

// Zustand beim Erreichen einer Frage, damit "Zurück" die Antworten wieder zurücksetzen kann
type Snap = {
  step: Step;
  title: string;
  lead: string[];
  answers: string;
  business: string;
  track: "community" | "business";
  wishKind: "duo" | "group";
  chosenGender?: string;
  chosenSector?: string;
  ageNow: number;
  hist: number;
};

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
  // Texte der Karten werden erst beim Anzeigen übersetzt, damit ein Sprachwechsel sofort wirkt
  const t = (key: string, vars?: Record<string, string | number>) => MARK + JSON.stringify({ k: key, v: vars });
  const r = (text: string) => {
    if (!text.startsWith(MARK)) return text;
    const parsed = JSON.parse(text.slice(1)) as { k: string; v?: Record<string, string | number> };
    return tx(parsed.k, parsed.v);
  };
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
  const [talkMode, setTalkMode] = useState<"free" | "ask">("free");
  const talkModeRef = useRef<"free" | "ask">("free");
  // Sprache des Gesprächs mit der KI: nur Deutsch oder Englisch (bei Tamil als Oberfläche startet Englisch)
  const [talkLang, setTalkLang] = useState<"de" | "en">(language === "en" || language === "ta" ? "en" : "de");
  const talkLangRef = useRef<"de" | "en">(language === "en" || language === "ta" ? "en" : "de");
  const tl = (key: string, vars?: Record<string, string | number>) => translateUi(key, talkLangRef.current, vars);
  const [talkBusy, setTalkBusy] = useState(false);
  const talkBusyRef = useRef(false);
  const [track, setTrack] = useState<"community" | "business">("community");
  const [ageNow, setAgeNow] = useState(25);
  const [chosenSector, setChosenSector] = useState<string | undefined>();
  const [goals, setGoals] = useState<Choice>(EMPTY);
  const [view, setView] = useState<View>(resume ? "chat" : "cards");
  const [card, setCard] = useState<{ title: string; lead: string[] }>({ title: "", lead: [] });
  const [canBack, setCanBack] = useState(false);
  const [prefill, setPrefill] = useState<Partial<OnboardingAnswers> | null>(null);
  const [consent, setConsent] = useState(false);
  // Wohnort: Postleitzahl (mit Land) oder, falls die nicht erkannt wird, der Ortsname
  const [postalCountry, setPostalCountry] = useState<"DE" | "AT" | "CH">("DE");
  const [cityByName, setCityByName] = useState(false);
  const [talkOn, setTalkOn] = useState(Boolean(resume));
  const [noticeOpen, setNoticeOpen] = useState(false);

  // Auswahlen, die in den Panels live bearbeitet werden
  const [interests, setInterests] = useState<Choice>(EMPTY);
  const [vibes, setVibes] = useState<Choice>(EMPTY);

  // Anmeldung am Ende
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const answers = useRef<Partial<OnboardingAnswers>>({});
  const viewRef = useRef<View>(resume ? "chat" : "cards");
  const stack = useRef<Snap[]>([]);
  const lastCity = useRef("");
  const rootRef = useRef<HTMLDivElement>(null);
  const photos = useRef<Blob[]>([]);
  const pendingPlace = useRef<{ name: string; lat: number; lng: number; hub: string; hubLabel: string } | null>(null);
  const business = useRef<{ sector?: string; role?: string; goals?: Choice }>({});
  const followAnswers = useRef<{ question: string; answer: string }[]>([]);
  // Chatverlauf (wird pro Konto gespeichert, für die Person selbst nicht sichtbar)
  const history = useRef<ChatTurn[]>([]);
  // Längeres Gespräch: schon gestellte Fragen, alles bisher Gesagte, Zähler für Zwischenfragen
  const askedQuestions = useRef<string[]>(resume?.asked ?? []);
  const talkContext = useRef<string>(resume?.context ?? "");
  const skipsInRow = useRef(0);
  // Gespräch: Verlauf für die KI, letzte KI-Frage, Zähler
  const talkTurns = useRef<{ role: "assistant" | "user"; text: string }[]>([]);
  // Angemeldet: Das Basis-Profil wird schon vor dem Gespräch gespeichert, neue Angaben aus dem Gespräch laufend
  const baseSaved = useRef(false);
  const sentCount = useRef(0);
  const syncing = useRef(false);
  const lastQuestion = useRef("");
  const userMessages = useRef(0);
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

  // Handy: Die Fläche folgt der sichtbaren Höhe, damit das Eingabefeld über der Tastatur bleibt
  useEffect(() => {
    const vv = window.visualViewport;
    const el = rootRef.current;
    if (!vv || !el) return;
    const update = () => {
      el.style.setProperty("--app-h", `${vv.height}px`);
      el.style.setProperty("--app-top", `${vv.offsetTop}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
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
      const message =
        typeof line === "string"
          ? { text: r(line) }
          : { ...line, text: r(line.text), link: line.link ? { ...line.link, label: r(line.link.label) } : undefined };
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
    if (viewRef.current === "chat") setMessages((m) => [...m, { id: nextId.current++, from: "user", text: message }]);
  }

  function switchView(next: View) {
    viewRef.current = next;
    setView(next);
  }

  // Karten-Ablauf: Frage steht sofort da (kein Tippen, keine Blasen). Merkt sich den Stand für "Zurück".
  function showCard(next: Step, title: string, lead: string[] = []) {
    switchView("cards");
    const hist = history.current.length;
    if (BACK_STEPS.includes(next)) {
      const snap: Snap = {
        step: next,
        title,
        lead,
        answers: JSON.stringify(answers.current),
        business: JSON.stringify(business.current),
        track,
        wishKind,
        chosenGender,
        chosenSector,
        ageNow,
        hist,
      };
      // Wird eine Frage erneut gestellt (z. B. anderer Ort), fällt alles danach aus dem Verlauf
      const at = stack.current.findIndex((x) => x.step === next);
      if (at >= 0) stack.current = stack.current.slice(0, at);
      stack.current.push(snap);
      setCanBack(stack.current.length > 1);
    }
    for (const line of lead) history.current.push({ role: "bot", text: r(line) });
    history.current.push({ role: "bot", text: r(title) });
    setCard({ title, lead });
    setText("");
    setInputError("");
    setPrefill(null);
    setTyping(false);
    setBusy(false);
    setStep(next);
  }

  // Eine Frage zurück: Antworten ab dieser Frage werden verworfen, die bisherige Eingabe wird wieder eingesetzt
  function goBack() {
    if (stack.current.length < 2) return;
    const departing: Partial<OnboardingAnswers> = { ...answers.current };
    const role = business.current.role ?? "";
    stack.current.pop();
    const prev = stack.current.pop();
    if (!prev) return;
    answers.current = JSON.parse(prev.answers);
    business.current = JSON.parse(prev.business);
    history.current.length = prev.hist;
    setTrack(prev.track);
    setWishKind(prev.wishKind);
    setChosenGender(prev.chosenGender);
    setChosenSector(prev.chosenSector);
    setAgeNow(prev.ageNow);
    showCard(prev.step, prev.title, prev.lead);
    setPrefill(departing);
    const typed =
      prev.step === "city" ? lastCity.current : prev.step === "role" ? role : prev.step === "nickname" ? (departing.profile?.displayName ?? "") : "";
    setText(typed);
  }

  // Bot spricht, danach erscheint das Antwort-Panel des nächsten Schritts
  async function ask(texts: BotLine[], next: Step) {
    if (!resume && CARD_STEPS.includes(next)) {
      const lines = texts.map((line) => (typeof line === "string" ? line : line.text));
      showCard(next, lines[lines.length - 1], lines.slice(0, -1));
      return;
    }
    switchView("chat");
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
      startTalkChoice();
      return;
    }
    ask(
      [
        t("Willkommen bei DSpora. Lass uns herausfinden, was dir wichtig ist."),
        t("Ein paar kurze Fragen (etwa 2 Minuten), die alle beantwortet werden müssen, damit wir passende Leute für dich finden. Danach kannst du freiwillig mit mir weiterreden."),
        t("Wonach suchst du bei DSpora?"),
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
    ask([t("In welcher Gruppengröße möchtest du Leute treffen?")], "groupSize");
  }

  function pickGroupSize(value: string, label: string) {
    answers.current.groupSize = value;
    setWishKind(value === "duo" ? "duo" : "group");
    user(tx(label));
    ask([t("Welches Geschlecht hast du? Du kannst auch etwas Eigenes schreiben.")], "gender");
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
          ? t("Welche Freundschaften suchst du?")
          : t("Welche Gruppe suchst du? Beantworte es so, wie es für dich passt."),
      ],
      "matchGender",
    );
  }

  function pickMatchGender(value: string, label: string) {
    const wishes = wishKind === "duo" ? DUO_WISHES : GROUP_WISHES;
    // Eigener Text (nicht in der Liste) heißt "Anderes"
    answers.current.matchGender = wishes.some((w) => w.id === value) ? value : "other";
    user(tx(label));
    ask([t("Wie alt bist du?")], "age");
  }

  function submitAge(age: number) {
    answers.current.age = age;
    setAgeNow(age);
    user(String(age));
    ask([t("Welche Altersspanne passt dir bei den anderen? Du kannst die Zahlen anpassen.")], "ageRange");
  }

  function submitAgeRange(min: number, max: number) {
    answers.current.ageMin = min;
    answers.current.ageMax = max;
    user(tx("{min} bis {max} Jahre", { min, max }));
    ask([t("Wie soll die Freundschaft aussehen?")], "meetMode");
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
    ask([t("Wie lautet deine Postleitzahl? Ich ordne dich damit dem nächsten Hub zu.")], "city");
  }

  async function submitCity() {
    const value = text.trim();
    const digits = postalCountry === "DE" ? 5 : 4;
    if (!cityByName && !new RegExp(`^\\d{${digits}}$`).test(value)) {
      setInputError(tx("Bitte gib deine Postleitzahl mit {n} Ziffern an.", { n: digits }));
      return;
    }
    if (cityByName && value.length < 2) {
      setInputError(tx("Bitte gib deinen Wohnort an."));
      return;
    }
    lastCity.current = value;
    user(value);
    setStep("intro");
    setBusy(true);
    setTyping(true);
    let place: { name: string; lat: number; lng: number; hub: string; hubLabel: string } | null = null;
    try {
      const res = await fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value, country: postalCountry }),
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
      if (!cityByName) {
        // Postleitzahl nicht erkannt: Ort per Name als Ausweg anbieten
        setCityByName(true);
        await ask([t("Diese Postleitzahl konnte ich leider nicht zuordnen. Prüfe sie oder gib stattdessen deinen Ort ein.")], "city");
        return;
      }
      await ask([t("Diesen Ort konnte ich leider nicht zuordnen. Bitte gib die nächstgrößere Stadt in deiner Nähe ein.")], "city");
      return;
    }
    pendingPlace.current = place;
    await ask(
      [
        place.hub === "warteliste"
          ? t("Ich habe „{name}“ gefunden. In deiner Nähe gibt es noch keinen Hub. Du kommst auf die Warteliste, und wir melden uns, sobald es einen gibt. Passt das so?", { name: place.name })
          : cityByName
            ? t("Ich habe „{name}“ gefunden und ordne dich dem Hub {hub} zu. Passt das?", { name: place.name, hub: tx(place.hubLabel) })
            : t("Die Postleitzahl {plz} gehört zu „{name}“. Ich ordne dich dem Hub {hub} zu. Passt das?", { plz: value, name: place.name, hub: tx(place.hubLabel) }),
      ],
      "cityConfirm",
    );
  }

  function confirmCity(yes: boolean) {
    const place = pendingPlace.current;
    if (!yes || !place) {
      user(tx("Anderen Ort eingeben"));
      ask([t("Kein Problem. Welcher Ort passt besser?")], "city");
      return;
    }
    answers.current.city = place.name;
    answers.current.lat = place.lat;
    answers.current.lng = place.lng;
    answers.current.region = place.hub;
    user(tx("Ja, passt"));
    ask([t("Wie weit darf jemand maximal von dir entfernt wohnen? Gemeint ist die Fahrzeit mit dem Auto.")], "travel");
  }

  function pickTravel(minutes: number, label: string) {
    answers.current.travelMinutes = minutes === 0 ? null : minutes;
    user(tx(label));
    ask([t("Wie oft würdest du dich realistisch mit jemandem treffen?")], "frequency");
  }

  function pickFrequency(value: string, label: string) {
    extras().meetFrequency = value;
    user(tx(label));
    askLanguages();
  }

  function askLanguages() {
    ask([t("Welche Sprachen sprichst du gern mit Freunden? Du kannst mehrere wählen oder eigene eintragen.")], "languages");
  }

  function confirmLanguages(chosen: Choice) {
    answers.current.languages = chosen;
    user(choiceLabels(chosen, LANGUAGES).map((l) => tx(l)).join(", "));
    if (track === "business") {
      ask([t("In welcher Branche oder welchem Sektor bist du unterwegs?")], "sector");
    } else {
      ask([t("Wo stehst du gerade im Leben?")], "lifePhase");
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
    ask([t("Und was ist deine aktuelle berufliche Rolle?")], "role");
  }

  function submitRole() {
    const value = text.trim();
    if (value.length < 2) {
      setInputError(tx("Bitte gib deine Rolle an (mindestens 2 Zeichen)."));
      return;
    }
    business.current.role = value;
    user(value);
    ask([t("Was ist dein Hauptziel bei DSpora? Wähle bis zu drei oder schreib dein eigenes.")], "goals");
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
          ? t("Was begeistert dich abseits der Arbeit? Gemeinsame Aktivitäten wie Tennis oder Padel verbinden oft am meisten. Tippe einen Vorschlag an oder schreib eigene Wörter.")
          : t("Was begeistert dich? Tippe einen Vorschlag an oder schreib eigene Wörter in die Felder."),
      ],
      "interests",
    );
  }

  function confirmInterests(chosen: Choice) {
    answers.current.interests = chosen;
    user(choiceLabels(chosen, INTERESTS).map((l) => tx(l)).join(", "));
    ask([t("Welcher Vibe beschreibt dich am besten? Auch hier gern eigene Wörter.")], "vibes");
  }

  function confirmVibes(chosen: Choice) {
    answers.current.vibes = chosen;
    user(choiceLabels(chosen, VIBES).map((l) => tx(l)).join(", "));
    ask(
      [
        t("Wie sollen wir dich nennen? Ein Spitzname oder Künstlername reicht, so kannst du anonym bleiben. Deinen echten Namen kannst du später im Profil ergänzen."),
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
    void saveBase();
    ask(
      [
        t("Möchtest du dein Profil durch ein kurzes Gespräch schärfen, damit unser System noch tiefgründigere Matches für dich findet?"),
        t("Basis-Profil erstellt."),
      ],
      "transition",
    );
  }

  // Erste Frage im Gespräch: knüpft an eine Antwort aus Phase 1 an
  function talkOpener(): string {
    const a = answers.current;
    if (track === "business" && a.business?.sector) {
      return tl("Du hast angegeben, dass du im Bereich {topic} unterwegs bist. Was reizt dich daran am meisten?", {
        topic: tl(labelOf(a.business.sector, SECTORS)),
      });
    }
    const first = a.interests ? choiceLabels(a.interests, INTERESTS)[0] : undefined;
    if (first) return tl("Du hast {topic} als Interesse angegeben. Was gefällt dir daran am meisten?", { topic: tl(first) });
    return tl("Was machst du am liebsten in deiner Freizeit?");
  }

  // Basis-Profil sofort speichern (nur angemeldet), damit nichts verloren geht, wenn man im Gespräch aufhört
  async function saveBase() {
    if (mode !== "live" || resume) return;
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers.current }),
      });
      if (res.ok) baseSaved.current = true;
    } catch {
      // am Ende wird noch einmal gespeichert
    }
  }

  // Neue Angaben aus dem Gespräch laufend ins Profil schreiben (nur angemeldet, nur was noch nicht gesendet wurde)
  async function syncFacts() {
    if (mode !== "live" || (!resume && !baseSaved.current) || syncing.current) return;
    const fresh = followAnswers.current.slice(sentCount.current);
    if (fresh.length === 0) return;
    syncing.current = true;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talk: { followUps: fresh } }),
      });
      if (res.ok) sentCount.current += fresh.length;
    } catch {
      // wird beim Beenden noch einmal versucht
    } finally {
      syncing.current = false;
    }
  }

  function pickTransition(wantsTalk: boolean) {
    if (!wantsTalk) {
      // Ohne Gespräch geht es direkt zur Anmeldung bzw. zum Speichern
      toAuth();
      return;
    }
    startTalkChoice();
  }

  function toWishes(intro: BotLine[] = []) {
    ask(
      [
        ...intro,
        t("Zum Abschluss habe ich noch eine Bitte an dich: Was wünschst du dir von DSpora? Welche Features oder Ideen sollten wir unbedingt einbauen?"),
      ],
      "wishes",
    );
  }

  // ——— Phase 2: Gespräch (frei erzählen oder Fragen, jederzeit umschaltbar), danach das Profil ———

  function extras() {
    answers.current.extras = answers.current.extras ?? {};
    return answers.current.extras;
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

  // Zu Beginn: frei erzählen oder Fragen stellen lassen (auch beim Fortsetzen aus dem Profil)
  function startTalkChoice() {
    setTalkOn(true);
    // Gespräch startet in der Oberflächensprache; Tamil gibt es hier nicht, dann Englisch
    const start = language === "de" ? "de" : "en";
    talkLangRef.current = start;
    setTalkLang(start);
    ask(
      [
        resume
          ? t("Schön, dass du wieder da bist! Erzähl mir, was es Neues gibt, oder ich stelle dir Fragen. Du kannst jederzeit wechseln.")
          : t("Wie möchtest du dich vorstellen? Du kannst jederzeit wechseln."),
      ],
      "talkMode",
    );
  }

  // Eine Nachricht des Chats anzeigen (ohne künstliche Wartezeit, die KI braucht ohnehin einen Moment)
  function say(message: string) {
    talkTurns.current.push({ role: "assistant", text: message });
    history.current.push({ role: "bot", text: message });
    setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: message }]);
  }

  // Die letzte Frage in einer Antwort der KI merken (für den Steckbrief und gegen Wiederholungen)
  function rememberQuestion(reply: string) {
    const found = reply.match(/[^.!?\n]*\?/g);
    const last = found ? found[found.length - 1].trim() : "";
    lastQuestion.current = last;
    if (last) askedQuestions.current.push(last);
  }

  type TalkReply = { reply: string; personal: boolean; related: boolean };

  // Nächste Nachricht der KI (bereinigt, ohne Geschlecht). Bei Fehler oder Zeitüberschreitung null: dann antwortet der Chat mit Regeln.
  async function aiTalk(mode: "free" | "ask", opening = false): Promise<TalkReply | null> {
    if (!aiEnabled) return null;
    try {
      const sb = currentSteckbrief();
      const hints = sb.lines
        .filter((l) => !["Geschlecht", "Verbinden mit", "Alter", "Gesuchtes Alter"].includes(l.label))
        .map((l) => `${l.label}: ${l.value}`)
        .slice(0, 10);
      const res = await fetch("/api/chat/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          opening,
          turns: talkTurns.current.slice(-14),
          hints,
          asked: askedQuestions.current.slice(-40),
          track: resume?.track ?? track,
          language: talkLangRef.current,
          skips: skipsInRow.current,
          // Im freien Modus nur gelegentlich eine Anschlussfrage (jede dritte Antwort)
          allowQuestion: userMessages.current % 3 === 1,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      return typeof data?.reply === "string"
        ? { reply: data.reply, personal: data.personal !== false, related: data.related === true }
        : null;
    } catch {
      return null;
    }
  }

  // Ohne KI: regelbasierte Frage bzw. freundliche Bestätigung
  function ruleReply(mode: "free" | "ask", lastUserText: string): string {
    if (mode === "free") return tl("Danke, das merke ich mir. Erzähl gern weiter.");
    const question = nextQuestion(lastUserText, talkContext.current, askedQuestions.current, talkLangRef.current);
    return question ?? tl("Was machst du am liebsten in deiner Freizeit?");
  }

  // Eine persönliche Nachricht als Angabe im Steckbrief festhalten (lange Texte in Stücken, passend zur Speichergrenze)
  function storeFact(answer: string, question: string) {
    const label = question || tx("Das hast du mir mitgeteilt");
    for (let i = 0; i < answer.length && followAnswers.current.length < 90; i += FOLLOW_UP_ANSWER_MAX) {
      followAnswers.current.push({ question: label.slice(0, 280), answer: answer.slice(i, i + FOLLOW_UP_ANSWER_MAX) });
    }
    if (!resume) extras().followUps = followAnswers.current.slice();
    void syncFacts();
  }

  // Antwort des Chats auf die letzte Nachricht der Person (oder Eröffnung, wenn userText leer ist)
  async function respond(userText: string, opening = false) {
    const mode = talkModeRef.current;
    talkBusyRef.current = true;
    setTalkBusy(true);
    setTyping(true);
    const result = await aiTalk(mode, opening);
    if (!alive.current) return;
    setTyping(false);
    const reply = result?.reply ?? ruleReply(mode, userText);
    if (userText && (result ? result.personal : true)) storeFact(userText, result ? (result.related ? lastQuestion.current : "") : lastQuestion.current);
    say(reply);
    if (mode === "ask") rememberQuestion(reply);
    else lastQuestion.current = "";
    talkBusyRef.current = false;
    setTalkBusy(false);
  }

  function changeMode(next: "free" | "ask") {
    talkModeRef.current = next;
    setTalkMode(next);
  }

  // Auswahl am Anfang: Ab hier läuft das Gespräch in einem Eingabefeld
  async function beginTalk(next: "free" | "ask") {
    changeMode(next);
    user(tx(next === "free" ? "Ich erzähle frei, was mir wichtig ist" : "Stell mir Fragen"));
    setText("");
    setInputError("");
    setBusy(false);
    setStep("talk");
    if (next === "ask" && !resume) {
      // Erste Frage knüpft an die Basis-Angaben an (ohne KI-Wartezeit)
      const opener = talkOpener();
      askedQuestions.current.push(opener);
      lastQuestion.current = opener;
      say(opener);
      return;
    }
    if (next === "free") {
      say(resume ? tl("Gern. Was gibt es Neues bei dir? Erzähl einfach, ich höre zu.") : tl("Gern. Erzähl einfach, was dir wichtig ist, wer du bist oder wonach du suchst. Auch was du nicht magst, hilft mir. Ich höre zu."));
      return;
    }
    await respond("", true);
  }

  // Zwischen frei erzählen und Fragen wechseln, mitten im Gespräch
  async function switchTalkMode(next: "free" | "ask") {
    if (next === talkModeRef.current || talkBusyRef.current) return;
    changeMode(next);
    if (next === "free") {
      say(tl("Gern. Erzähl einfach, was dir gerade wichtig ist, ich höre zu."));
      return;
    }
    await respond("", true);
  }

  async function sendTalk() {
    const value = text.trim();
    if (!value || talkBusyRef.current) return;
    // Das Gespräch läuft nur auf Deutsch oder Englisch: tamilische Schrift wird freundlich abgelehnt
    if (/[\u0B80-\u0BFF]/.test(value)) {
      setInputError(tx("Das Gespräch läuft auf Deutsch oder Englisch. Bitte schreib in einer dieser Sprachen."));
      return;
    }
    setInputError("");
    setText("");
    user(value);
    // Der Steckbrief: Was weiß DSpora gerade über mich? Anzeigen, ohne das Gespräch zu unterbrechen.
    if (isSteckbriefRequest(value)) {
      talkTurns.current.push({ role: "user", text: value });
      say(steckbriefText(currentSteckbrief(), tx));
      return;
    }
    userMessages.current += 1;
    skipsInRow.current = 0;
    talkTurns.current.push({ role: "user", text: value });
    talkContext.current += ` ${value}`;
    await respond(value);
  }

  // Im Fragen-Modus: Frage überspringen, die KI stellt eine andere
  async function askAnother() {
    if (talkBusyRef.current) return;
    user(tx("Andere Frage"));
    skipsInRow.current += 1;
    talkTurns.current.push({ role: "user", text: "(möchte diese Frage überspringen)" });
    await respond("");
  }

  function endTalk() {
    if (talkBusyRef.current) return;
    exitTalk([tx("Danke dir für das Gespräch! Alles Wichtige habe ich in deinem Steckbrief festgehalten.")]);
  }

  // Gespräch beenden: neu angemeldet geht es mit den Wünschen weiter, beim Fortsetzen werden die neuen Antworten gespeichert.
  function exitTalk(intro: BotLine[] = []) {
    setTalkOn(false);
    if (resume) {
      finishResume(intro);
      return;
    }
    toWishes(intro);
  }

  async function finishResume(intro: BotLine[] = []) {
    switchView("chat");
    setStep("intro");
    await bot([...intro, tx("Einen Moment, ich speichere deine Antworten …")]);
    if (!alive.current) return;
    setBusy(true);
    setTyping(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talk: { followUps: followAnswers.current.slice(sentCount.current), transcript: history.current.slice(-MAX_TRANSCRIPT) } }),
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
      showLoginCard();
      return;
    }
    finishSave();
  }

  function showLoginCard() {
    showCard("login", t("Fast geschafft!"), [
      t("Zum Schluss bestätigst du deine E-Mail-Adresse. Ich schicke dir einen Link, mit dem du dich anmeldest und dein Profil gespeichert wird."),
    ]);
  }

  // Angemeldet (live), Admin-Test oder Vorschau: Antworten direkt senden
  async function finishSave() {
    setTalkOn(false);
    switchView("chat");
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
    if (!consent) {
      setLoginError(tx("Bitte bestätige die Datenschutzbestimmungen."));
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
          consent: true,
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
      setCooldown(RESEND_SECONDS);
      showCard("sent", t("Check dein Postfach."), [
        t("Ich habe dir einen Link an {value} geschickt. Mit einem Klick bist du drin, ganz ohne Passwort.", { value }),
        t("Schau auch im Spam-Ordner nach, falls nichts ankommt."),
      ]);
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
  const progress = resume
    ? 0
    : inFinale || step === "transition"
      ? 1
      : inTalk
        ? 0.9
        : questionIndex >= 0
          ? (questionIndex + 1) / (phase1.length + 1)
          : 0;
  const headerLabel = resume
    ? tx("Gespräch")
    : inFinale
      ? tx("Finale")
      : inTalk
        ? tx("Phase 2")
        : questionIndex >= 0
          ? tx("Frage {i} / {n}", { i: questionIndex + 1, n: phase1.length })
          : "";

  const cards = view === "cards";
  const showNotice = aiEnabled && view === "chat" && talkOn;
  const cardTitle = r(card.title);
  const longTitle = cardTitle.length > 70;

  function renderPanel() {
    return (
      <>
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
          customPlaceholder={tx("Eigene Angabe + Enter")}
        />
      )}

      {step === "matchGender" && (
        <SingleChoice
          options={wishKind === "duo" ? DUO_WISHES : GROUP_WISHES}
          onSelect={pickMatchGender}
          customPlaceholder={tx("Eigene Angabe + Enter")}
        />
      )}

      {step === "age" && <AgeInput key="age" onSubmit={submitAge} initial={prefill?.age} />}

      {step === "ageRange" && (
        <AgeRangeInput
          key="ageRange"
          age={ageNow}
          onSubmit={submitAgeRange}
          initial={prefill?.ageMin && prefill?.ageMax ? { min: prefill.ageMin, max: prefill.ageMax } : undefined}
        />
      )}

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
        <div className="space-y-3">
          {!cityByName && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx("Land")}>
              {(
                [
                  { id: "DE", label: "Deutschland" },
                  { id: "AT", label: "Österreich" },
                  { id: "CH", label: "Schweiz" },
                ] as const
              ).map((c) => (
                <Chip
                  key={c.id}
                  selected={postalCountry === c.id}
                  onClick={() => {
                    setPostalCountry(c.id);
                    setInputError("");
                    setText((v) => v.slice(0, c.id === "DE" ? 5 : 4));
                  }}
                >
                  {tx(c.label)}
                </Chip>
              ))}
            </div>
          )}
          <TextAnswer
            value={text}
            onChange={(v) => {
              setText(cityByName ? v : v.replace(/\D/g, ""));
              setInputError("");
            }}
            onSubmit={() => submitCity()}
            placeholder={cityByName ? tx("Dein Wohnort") : tx("Deine Postleitzahl")}
            inputMode={cityByName ? "text" : "numeric"}
            maxLength={cityByName ? 60 : postalCountry === "DE" ? 5 : 4}
            error={inputError}
          />
        </div>
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
          customPlaceholder={tx("Andere Sprache + Enter")}
        />
      )}

      {step === "lifePhase" && (
        <SingleChoice options={PHASES} onSelect={pickPhase} customPlaceholder={tx("Eigene Angabe + Enter")} />
      )}

      {step === "sector" && (
        <SingleChoice
          options={SECTORS}
          value={chosenSector}
          onSelect={pickSector}
          customPlaceholder={tx("Eigene Branche + Enter")}
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
          customPlaceholder={tx("Eigenes Ziel + Enter")}
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
          initial={prefill?.interests}
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
          initial={prefill?.vibes}
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

      {step === "transition" && (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => pickTransition(true)}
            className="cta-premium w-full rounded-2xl bg-gradient-to-b from-gold-light to-gold px-5 py-4 text-base font-semibold text-zinc-950"
          >
            {tx("Ja, Gespräch starten")}
          </button>
          <button
            type="button"
            onClick={() => pickTransition(false)}
            className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 text-base font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-colors hover:border-gold/50"
          >
            {tx("Nein, direkt zum Hub")}
          </button>
        </div>
      )}

      {step === "talkMode" && (
        <ChipRow>
          <Chip onClick={() => beginTalk("free")}>{tx("Ich erzähle frei, was mir wichtig ist")}</Chip>
          <Chip onClick={() => beginTalk("ask")}>{tx("Stell mir Fragen")}</Chip>
        </ChipRow>
      )}

      {step === "talk" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip selected={talkMode === "free"} onClick={() => switchTalkMode("free")}>
              {tx("Frei erzählen")}
            </Chip>
            <Chip selected={talkMode === "ask"} onClick={() => switchTalkMode("ask")}>
              {tx("Fragen")}
            </Chip>
            <button
              type="button"
              onClick={endTalk}
              className="ml-auto py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              {tx("Gespräch beenden")}
            </button>
          </div>
          <LongTextAnswer
            value={text}
            onChange={setText}
            onSubmit={sendTalk}
            placeholder={talkMode === "free" ? tx("Schreib, was dir wichtig ist …") : tx("Deine Antwort oder was du gerade sagen möchtest …")}
            maxLength={800}
            minLength={1}
            rows={3}
            busy={talkBusy}
            error={inputError}
            skipLabel={tx("Andere Frage")}
            onSkip={talkMode === "ask" ? askAnother : undefined}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <span>{tx("Gespräch auf Deutsch oder English:")}</span>
            {(
              [
                { id: "de", label: "Deutsch" },
                { id: "en", label: "English" },
              ] as const
            ).map((l) => (
              <Chip
                key={l.id}
                selected={talkLang === l.id}
                onClick={() => {
                  talkLangRef.current = l.id;
                  setTalkLang(l.id);
                  setInputError("");
                }}
              >
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
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
          <ConsentCheckbox checked={consent} onChange={(v) => { setConsent(v); setLoginError(""); }} id="chat-consent" />
          <button
            type="submit"
            disabled={sending || !email.trim() || !consent}
            className="cta-premium w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-50"
          >
            {sending ? tx("Sende …") : tx("Jetzt anmelden & Profil speichern")}
          </button>
          <p className="px-2 text-center text-xs leading-relaxed text-zinc-300">
            {tx("Kein Passwort nötig. Deine E-Mail-Adresse bleibt für andere unsichtbar.")}
          </p>
        </form>
      )}

      {step === "sent" && (
        <ChipRow>
          <Chip
            onClick={() => {
              showLoginCard();
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
      </>
    );
  }

  return (
    <div
      ref={rootRef}
      onFocusCapture={scrollFieldIntoView}
      className="fixed inset-x-0 top-[var(--app-top,0px)] isolate flex h-[var(--app-h,100dvh)] items-center justify-center overflow-hidden bg-zinc-950 sm:static sm:h-auto sm:min-h-[100dvh] sm:p-6"
    >
      <FlowingWaveBackground pulses={false} fixed />
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-white/10 bg-zinc-950/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md sm:h-[min(780px,calc(100dvh-3rem))] sm:rounded-3xl sm:border">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full glow-gold" />

        {/* Kopfzeile */}
        <header className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-5 py-4">
          {cards && canBack && BACK_STEPS.includes(step) ? (
            <button type="button" onClick={goBack} className="justify-self-start text-sm whitespace-nowrap text-zinc-200 transition-colors hover:text-white">
              {tx("← Zurück")}
            </button>
          ) : (
            <Link
              href={mode === "test" ? "/admin" : "/"}
              className="justify-self-start text-sm whitespace-nowrap text-zinc-200 transition-colors hover:text-white"
            >
              {cards ? tx("← Startseite") : tx("← Zurück")}
            </Link>
          )}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(242,166,90,0.9)]" />
            DSpora
            {mode === "test" && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-gold normal-case">
                {tx("Testmodus")}
              </span>
            )}
          </div>
          <span className="justify-self-end text-sm whitespace-nowrap text-zinc-200">{headerLabel}</span>
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

        {cards ? (
          /* Phase 1 und Anmeldung: eine Frage pro Bildschirm */
          <div className="relative flex-1 overflow-x-hidden overflow-y-auto px-5 pt-8 pb-8 sm:px-8">
            {step === "intro" && typing && (
              <div className="flex justify-center pt-16" aria-label={tx("DSpora schreibt")}>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-gold"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            )}
            {step !== "intro" && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                {step === "transition" && (
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-[0_0_30px_-8px_rgba(242,166,90,0.6)]">
                    <CheckIcon className="h-7 w-7" />
                  </div>
                )}
                {!LEAD_BELOW.includes(step) &&
                  card.lead.map((line) => (
                    <p key={line} className="mb-3 text-sm leading-relaxed text-zinc-200">
                      {r(line)}
                    </p>
                  ))}
                <h1 className={`${longTitle ? "text-xl" : "text-2xl"} leading-snug font-bold text-zinc-50`}>{cardTitle}</h1>
                {LEAD_BELOW.includes(step) &&
                  card.lead.map((line) => (
                    <p key={line} className="mt-3 text-base leading-relaxed text-zinc-200">
                      {r(line)}
                    </p>
                  ))}
                <div className="mt-6">
                  {BIG_STEPS.includes(step) ? <BigChoices>{renderPanel()}</BigChoices> : renderPanel()}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <>
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
                          ? "max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
                          : "max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-[15px] leading-relaxed font-medium break-words text-zinc-950 shadow-[0_8px_20px_-10px_rgba(242,166,90,0.5)]"
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
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            {/* Antwortbereich: bleibt unten, über der Tastatur */}
            <div className="relative max-h-[62%] min-h-[88px] overflow-y-auto border-t border-white/10 bg-zinc-950/30 px-4 pt-4 pb-3 sm:px-6">
              <AnimatePresence mode="wait" initial={false}>
                {showPanel && (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {renderPanel()}
                  </motion.div>
                )}
              </AnimatePresence>
              {showNotice && (
                <button
                  type="button"
                  onClick={() => setNoticeOpen(true)}
                  className="mx-auto mt-3 flex items-center gap-1.5 text-xs leading-tight text-zinc-300 transition-colors hover:text-white"
                  aria-label={tx("KI-Analyse und Datenschutz")}
                >
                  <ShieldIcon className="h-3 w-3 shrink-0" />
                  <span>{tx("KI-Analyse aktiv. Sensible Daten werden automatisch gefiltert.")}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hinweis zur KI-Analyse als Bottom-Sheet */}
      <AnimatePresence>
        {noticeOpen && (
          <motion.div
            key="notice"
            className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNoticeOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notice-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-t-3xl border border-white/10 bg-zinc-900 px-6 pt-6 pb-8 shadow-[0_-30px_80px_-30px_rgba(0,0,0,0.9)]"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
              <div className="flex items-center gap-2.5 text-gold">
                <ShieldIcon className="h-5 w-5" />
                <h2 id="notice-title" className="text-lg font-semibold text-zinc-50">
                  {tx("KI-Analyse und Datenschutz")}
                </h2>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">
                {tx("Deine Eingaben werden von unserem KI-System analysiert, um perfekte Matches zu finden. E-Mails, Nummern und Links werden vor der Verarbeitung automatisch gelöscht.")}
              </p>
              <div className="mt-6 flex items-center justify-between gap-3">
                <Link href="/datenschutz" target="_blank" className="text-sm text-gold underline underline-offset-2">
                  {tx("Datenschutzbestimmungen")}
                </Link>
                <button
                  type="button"
                  onClick={() => setNoticeOpen(false)}
                  className="rounded-full border border-white/15 bg-white/[0.07] px-5 py-2 text-sm font-medium text-zinc-50"
                >
                  {tx("Schließen")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && (
        <ReadyWindow
          kind={ready.kind}
          email={ready.email}
          onResend={
            ready.kind === "guest"
              ? () => {
                  setReady(null);
                  showLoginCard();
                  shownAt.current = Date.now() - 2000;
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
