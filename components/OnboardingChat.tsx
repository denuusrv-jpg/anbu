"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import ProfileForm, { type ProfileResult } from "@/components/onboarding/ProfileForm";
import SingleChoice from "@/components/onboarding/SingleChoice";
import { LightCvForm } from "@/components/onboarding/BusinessFields";
import { Chip, ChipRow, LongTextAnswer, TextAnswer } from "@/components/onboarding/ui";
import { getBrowserClient } from "@/lib/supabase/client";
import { stashPhotos } from "@/lib/draftPhotos";
import { pickFollowUps } from "@/lib/followups";
import {
  FOLLOW_UP_ANSWER_MAX,
  FREE_TEXT_MAX,
  HUB_REASON_MAX,
  GOALS,
  GROUP_SIZES,
  INTERESTS,
  MAX_HUBS,
  MEET_FREQUENCIES,
  REGIONS,
  ROLE_MAX,
  SECTORS,
  TRACKS,
  VIBES,
  WISHES_MAX,
  choiceLabels,
  labelOf,
  type Choice,
  type LightCv,
  type OnboardingAnswers,
} from "@/lib/onboarding";

type Step =
  | "intro"
  | "groupSize"
  | "region"
  | "hubReason"
  | "city"
  | "interests"
  | "vibes"
  | "more"
  | "mode"
  | "track"
  | "sector"
  | "role"
  | "goals"
  | "cv"
  | "freeText"
  | "followUp"
  | "frequency"
  | "profile"
  | "wishes"
  | "login"
  | "sent"
  | "retry";

type Message = { id: number; from: "bot" | "user"; text: string };

const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const EMPTY: Choice = { ids: [], custom: [] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;

// Fortschritt der Kernfragen (Anzeige oben); danach "Profil" und "Finale"
const TOTAL_STEPS = 5;
const STEP_NUMBER: Partial<Record<Step, number>> = {
  groupSize: 1,
  region: 2,
  hubReason: 2,
  city: 2,
  interests: 3,
  vibes: 4,
  more: 5,
  freeText: 5,
  followUp: 5,
  frequency: 5,
  mode: 5,
};
const PROFILE_STEPS: Step[] = ["track", "sector", "role", "goals", "cv", "profile"];
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
}: {
  mode?: ChatMode;
  userId?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState("");
  const [hubs, setHubs] = useState<Choice>(EMPTY);
  const [chosenFrequency, setChosenFrequency] = useState<string | undefined>();
  const [path, setPath] = useState<"anonymous" | "profile">("anonymous");
  const [followQuestion, setFollowQuestion] = useState("");
  const [track, setTrack] = useState<"community" | "business">("community");
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
  const business = useRef<{ sector?: string; role?: string; goals?: Choice }>({});
  const followQueue = useRef<string[]>([]);
  const followAnswers = useRef<{ question: string; answer: string }[]>([]);
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
  async function bot(texts: string[]) {
    setBusy(true);
    for (const message of texts) {
      setTyping(true);
      await sleep(650 + Math.min(message.length * 8, 850));
      if (!alive.current) return;
      setTyping(false);
      setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: message }]);
      await sleep(220);
    }
    if (alive.current) setBusy(false);
  }

  function user(message: string) {
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: message }]);
  }

  // Bot spricht, danach erscheint das Antwort-Panel des nächsten Schritts
  async function ask(texts: string[], next: Step) {
    setStep("intro");
    setText("");
    setInputError("");
    await bot(texts);
    if (alive.current) setStep(next);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ask(
      [
        "Willkommen bei DSpora. Lass uns herausfinden, wer wirklich zu dir passt – ganz anonym und in deinem Tempo.",
        "Ein paar kurze Fragen, dann bist du durch. Zuerst: In welcher Gruppengröße möchtest du Leute treffen?",
      ],
      "groupSize",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Basis-Flow: Gruppengröße, Region, Interessen, Vibe ———

  function pickGroupSize(value: string, label: string) {
    answers.current.groupSize = value;
    user(label);
    ask(
      [
        "Gute Wahl! In welchen Bereichen (Hubs) wäre es für dich noch in Ordnung, mit einer Person befreundet zu sein? Du kannst maximal zwei Hubs auswählen.",
      ],
      "region",
    );
  }

  function confirmHubs(chosen: Choice) {
    const list = [...chosen.ids, ...chosen.custom];
    answers.current.region = list[0];
    answers.current.secondRegion = list[1];
    user(choiceLabels(chosen, REGIONS).join(" + "));
    if (list.length > 1) {
      ask(
        [
          "Du hast zwei Hubs gewählt. Was steckt dahinter? Zum Beispiel Studium, Job, Familie oder Pendeln. So können wir später besser einschätzen, wie oft ihr euch sehen könntet.",
        ],
        "hubReason",
      );
      return;
    }
    askCity();
  }

  function askCity() {
    ask(["Und in welcher Stadt wohnst du? So finden wir Leute in deiner Nähe. Du kannst auch überspringen."], "city");
  }

  function submitHubReason(skip = false) {
    const value = text.trim();
    extras().hubReason = skip || !value ? undefined : value;
    user(skip || !value ? "Überspringen" : value);
    askCity();
  }

  function submitCity(skip = false) {
    const value = text.trim();
    if (!skip && value.length > 60) {
      setInputError("Maximal 60 Zeichen.");
      return;
    }
    answers.current.city = skip || !value ? undefined : value;
    user(skip || !value ? "Überspringen" : value);
    ask(
      ["Was begeistert dich? Such dir aus, was passt – und wenn etwas fehlt, trag einfach dein eigenes ein."],
      "interests",
    );
  }

  function confirmInterests(chosen: Choice) {
    answers.current.interests = chosen;
    user(choiceLabels(chosen, INTERESTS).join(", "));
    ask(["Und welcher Vibe beschreibt dich am besten? Wähle gern mehrere oder schreib deinen eigenen."], "vibes");
  }

  function confirmVibes(chosen: Choice) {
    answers.current.vibes = chosen;
    user(choiceLabels(chosen, VIBES).join(", "));
    ask(
      [
        "Möchtest du noch ein bisschen mit mir plaudern, damit ich dich besser kennenlerne? Das ist freiwillig, du kannst auch direkt weitermachen.",
      ],
      "more",
    );
  }

  function pickMore(wantsChat: boolean) {
    if (!wantsChat) {
      user("Nein, weiter");
      askMode();
      return;
    }
    user("Ja, gern");
    ask(["Schön! Erzähl frei heraus, was dir wichtig ist, wer du bist oder wonach du suchst …"], "freeText");
  }

  function askFrequency(intro: string[] = []) {
    setChosenFrequency(undefined);
    ask(
      [
        ...intro,
        "Noch eine Frage, die bei einem längeren Gespräch wichtig ist: Wie oft würdest du eine Person maximal sehen wollen? Zum Beispiel nur am Wochenende.",
      ],
      "frequency",
    );
  }

  function pickFrequency(value: string, label: string) {
    if (!value) {
      setChosenFrequency(undefined);
      return;
    }
    extras().meetFrequency = value;
    setChosenFrequency(value);
    user(label);
    askMode();
  }

  function askMode(intro: string[] = []) {
    ask(
      [
        ...intro,
        "Jetzt die große Frage: Möchtest du ganz anonym starten – oder ein Profil mit deiner Geschichte anlegen? Beides ist völlig okay, und du kannst es später im Hub ändern.",
      ],
      "mode",
    );
  }

  // ——— Die große Weiche ———

  function pickMode(next: "anonymous" | "profile") {
    answers.current.mode = next;
    setPath(next);
    if (next === "anonymous") {
      user("Anonym starten");
      ask(
        [
          "Sehr gut, so bleibst du absolut anonym: Niemand sieht deinen Namen oder deine E-Mail-Adresse.",
          "Die Anmeldung läuft über einen sicheren Link per E-Mail, einen sogenannten Magic Link. Du brauchst kein Passwort und musst dir nichts merken.",
          "Zum Abschluss habe ich noch eine Bitte an dich: Was wünschst du dir von DSpora? Welche Features oder Ideen sollten wir unbedingt einbauen?",
        ],
        "wishes",
      );
      return;
    }
    user("Profil anlegen");
    ask(
      [
        "Wunderbar! Wie möchtest du dich bei DSpora einbringen? Privat in der Community oder geschäftlich, zum Beispiel auf der Suche nach Co-Foundern oder Kooperationen?",
      ],
      "track",
    );
  }

  // ——— Modus-Weiche: Privat / Community oder Business & Co-Founding ———

  function pickTrack(next: "community" | "business") {
    answers.current.track = next;
    setTrack(next);
    user(labelOf(next, TRACKS));
    if (next === "community") {
      goToProfileForm();
      return;
    }
    ask(["Spannend! In welcher Branche oder welchem Sektor bist du unterwegs?"], "sector");
  }

  function pickSector(value: string, label: string) {
    if (!value) {
      setChosenSector(undefined);
      return;
    }
    business.current.sector = value;
    setChosenSector(value);
    user(label);
    ask(["Und was ist deine aktuelle berufliche Rolle?"], "role");
  }

  function submitRole() {
    const value = text.trim();
    if (value.length < 2) {
      setInputError("Bitte gib deine Rolle an (mindestens 2 Zeichen).");
      return;
    }
    business.current.role = value;
    user(value);
    ask(
      ["Was ist dein Hauptziel bei DSpora? Wähle bis zu drei – oder schreib dein eigenes."],
      "goals",
    );
  }

  function confirmGoals(chosen: Choice) {
    business.current.goals = chosen;
    user(choiceLabels(chosen, GOALS).join(", "));
    ask(
      [
        "Jetzt dein Light-CV: kein klassischer Lebenslauf, sondern ein kompakter Steckbrief. Expertise, deine Top-3-Erfolge und optional ein paar Links. Alles kann kurz bleiben.",
      ],
      "cv",
    );
  }

  function submitCv(cv: LightCv) {
    answers.current.business = {
      sector: business.current.sector as string,
      role: business.current.role as string,
      goals: business.current.goals as Choice,
      cv,
    };
    const parts = [
      cv.expertise ? "Expertise" : null,
      cv.achievements.length ? `${cv.achievements.length} Erfolg${cv.achievements.length === 1 ? "" : "e"}` : null,
      cv.links.length ? `${cv.links.length} Link${cv.links.length === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    user(parts.length ? `Light-CV: ${parts.join(", ")}` : "Light-CV später ergänzen");
    goToProfileForm();
  }

  // ——— Freitext und Folgefragen (optional, vor der Weiche), danach das Profil ———

  function extras() {
    answers.current.extras = answers.current.extras ?? {};
    return answers.current.extras;
  }

  function submitFreeText(skip = false) {
    const value = text.trim();
    extras().freeText = skip || !value ? undefined : value;
    user(skip || !value ? "Überspringen" : value);
    followAnswers.current = [];

    followQueue.current = skip || !value ? [] : pickFollowUps(value, 2).map((f) => f.question);
    if (followQueue.current.length === 0) {
      askFrequency(skip || !value ? [] : ["Danke fürs Erzählen!"]);
      return;
    }
    askNextFollowUp(["Danke, das erzählt schon viel über dich. Dazu habe ich noch eine Frage:"]);
  }

  function askNextFollowUp(intro: string[] = []) {
    const question = followQueue.current.shift();
    if (!question) {
      askFrequency();
      return;
    }
    setFollowQuestion(question);
    ask([...intro, question], "followUp");
  }

  function submitFollowUp(skip = false) {
    const value = text.trim();
    if (!skip && value) {
      followAnswers.current.push({ question: followQuestion, answer: value });
      extras().followUps = followAnswers.current.slice();
    }
    user(skip || !value ? "Überspringen" : value);
    if (followQueue.current.length > 0) {
      askNextFollowUp(["Und noch eine Frage:"]);
    } else {
      askFrequency(["Danke, das hilft mir sehr!"]);
    }
  }

  function goToProfileForm() {
    ask(
      [
        "Noch ein paar Details für dein Profil. Nur der Anzeigename ist Pflicht, alles andere ist freiwillig – und du bestimmst, wer dein Profil sehen darf.",
      ],
      "profile",
    );
  }

  function submitProfile({ profile, photos: blobs }: ProfileResult) {
    answers.current.profile = profile;
    photos.current = blobs;
    user(
      `Profil angelegt: ${profile.displayName}${
        blobs.length > 0 ? ` · ${blobs.length} ${blobs.length === 1 ? "Foto" : "Fotos"}` : ""
      }`,
    );
    ask(
      [
        "Danke, das Profil steht! Zum Abschluss habe ich noch eine Bitte an dich: Was wünschst du dir von DSpora? Welche Features oder Ideen sollten wir unbedingt einbauen?",
      ],
      "wishes",
    );
  }

  // ——— Finale: Wünsche, dann Anmeldung/Speichern ———

  function submitWishes(skip = false) {
    const value = text.trim();
    extras().wishes = skip || !value ? undefined : value;
    user(skip || !value ? "Überspringen" : value);
    toAuth();
  }

  function toAuth() {
    if (mode === "guest") {
      shownAt.current = Date.now();
      ask(
        [
          path === "anonymous"
            ? "Fast geschafft! Zum Schluss bestätigst du deine E-Mail-Adresse. Ich schicke dir einen Link, mit dem du dich anonym anmeldest."
            : "Fast geschafft! Zum Schluss bestätigst du deine E-Mail-Adresse. Ich schicke dir einen Link, mit dem du dich anmeldest und dein Profil gespeichert wird.",
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
    await bot(["Perfekt, danke dir! Einen Moment, ich lege dein Profil an …"]);
    if (!alive.current) return;
    setBusy(true);
    setTyping(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...answers.current, test: mode === "test" ? true : undefined }),
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
        await bot(["Deine Antworten sind gespeichert, nur die Fotos konnten leider nicht hochgeladen werden."]);
      }
      await bot(["Du bist startklar!"]);
      await sleep(600);
      if (alive.current) router.push(mode === "test" ? "/admin" : "/onboarding/fertig");
    } catch {
      setTyping(false);
      await bot(["Das hat leider nicht geklappt. Magst du es noch einmal versuchen?"]);
      setStep("retry");
    }
  }

  // Gast: Link anfordern. Die Antworten gehen als Entwurf mit und werden nach dem Klick übernommen.
  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending) return;
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) {
      setLoginError("Bitte gib eine gültige E-Mail-Adresse ein.");
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLoginError(data?.error ?? "Das hat leider nicht geklappt. Bitte versuch es noch einmal.");
        return;
      }
      await stashPhotos(photos.current);
      user(value);
      setCooldown(RESEND_SECONDS);
      await ask(
        [
          `Check dein Postfach: Ich habe dir einen Link an ${value} geschickt. Mit einem Klick bist du drin, ganz ohne Passwort.`,
          "Schau auch im Spam-Ordner nach, falls nichts ankommt.",
        ],
        "sent",
      );
    } catch {
      setLoginError("Keine Verbindung. Bitte versuch es noch einmal.");
    } finally {
      setSending(false);
    }
  }

  const stepNumber = STEP_NUMBER[step];
  const inProfile = PROFILE_STEPS.includes(step);
  const inFinale = FINALE_STEPS.includes(step);
  const showPanel = !busy && step !== "intro";
  const progress = inFinale ? 1 : inProfile ? 0.9 : (stepNumber ?? 0) / TOTAL_STEPS;
  const headerLabel = inFinale ? "Finale" : inProfile ? "Profil" : stepNumber ? `${stepNumber} / ${TOTAL_STEPS}` : "";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:h-[min(780px,calc(100dvh-3rem))] sm:rounded-3xl sm:border">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />

        {/* Kopfzeile */}
        <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            href={mode === "test" ? "/admin" : "/"}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Zurück
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(242,166,90,0.9)]" />
            DSpora
            {mode === "test" && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-gold normal-case">
                Testmodus
              </span>
            )}
          </div>
          <span className="w-14 text-right text-xs text-zinc-500">{headerLabel}</span>
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/5">
            <motion.div
              className="h-full bg-gold/70"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        </header>

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
                      ? "max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_26px_-12px_rgba(242,166,90,0.45)] backdrop-blur-xl"
                      : "max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-sm leading-relaxed font-medium break-words text-zinc-950 shadow-[0_8px_20px_-10px_rgba(242,166,90,0.5)]"
                  }
                >
                  {message.text}
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
                aria-label="DSpora schreibt"
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
                {step === "groupSize" && (
                  <ChipRow>
                    {GROUP_SIZES.map((g) => (
                      <Chip key={g.id} onClick={() => pickGroupSize(g.id, g.label)}>
                        {g.label}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "region" && (
                  <ChoiceSelect
                    options={REGIONS}
                    value={hubs}
                    onChange={setHubs}
                    onConfirm={confirmHubs}
                    maxTotal={MAX_HUBS}
                    customPlaceholder="Woanders? Schreib deine Region oder dein Land"
                  />
                )}

                {step === "hubReason" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitHubReason()}
                    placeholder="z. B. Ich studiere in Köln, meine Familie lebt in Stuttgart …"
                    maxLength={HUB_REASON_MAX}
                    minLength={3}
                    onSkip={() => submitHubReason(true)}
                  />
                )}

                {step === "city" && (
                  <TextAnswer
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={() => submitCity()}
                    placeholder="Deine Stadt"
                    error={inputError}
                    extra={
                      <Chip onClick={() => submitCity(true)} subtle>
                        Überspringen
                      </Chip>
                    }
                  />
                )}

                {step === "interests" && (
                  <ChoiceSelect
                    options={INTERESTS}
                    value={interests}
                    onChange={setInterests}
                    onConfirm={confirmInterests}
                    customPlaceholder="Etwas anderes? Eigenes hinzufügen"
                  />
                )}

                {step === "vibes" && (
                  <ChoiceSelect
                    options={VIBES}
                    value={vibes}
                    onChange={setVibes}
                    onConfirm={confirmVibes}
                    customPlaceholder="Dein eigener Vibe"
                  />
                )}

                {step === "more" && (
                  <ChipRow>
                    <Chip onClick={() => pickMore(true)}>Ja, gern</Chip>
                    <Chip onClick={() => pickMore(false)} subtle>
                      Nein, weiter
                    </Chip>
                  </ChipRow>
                )}

                {step === "mode" && (
                  <ChipRow>
                    <Chip onClick={() => pickMode("anonymous")}>Anonym starten</Chip>
                    <Chip onClick={() => pickMode("profile")}>Profil anlegen</Chip>
                  </ChipRow>
                )}

                {step === "track" && (
                  <ChipRow>
                    {TRACKS.map((t) => (
                      <Chip key={t.id} onClick={() => pickTrack(t.id as "community" | "business")}>
                        {t.label}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "sector" && (
                  <SingleChoice
                    options={SECTORS}
                    value={chosenSector}
                    onSelect={pickSector}
                    customPlaceholder="Andere Branche? Eigene Angabe"
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
                    placeholder="z. B. Gründerin, Product Manager, Entwickler"
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
                    customPlaceholder="Ein anderes Ziel? Eigenes hinzufügen"
                    maxTotal={3}
                  />
                )}

                {step === "cv" && <LightCvForm onSubmit={submitCv} />}

                {step === "freeText" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitFreeText()}
                    placeholder="Erzähl frei heraus, was dir wichtig ist, wer du bist oder wonach du suchst …"
                    maxLength={FREE_TEXT_MAX}
                    minLength={10}
                    rows={5}
                    onSkip={() => submitFreeText(true)}
                  />
                )}

                {step === "followUp" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitFollowUp()}
                    placeholder="Deine Antwort …"
                    maxLength={FOLLOW_UP_ANSWER_MAX}
                    minLength={2}
                    onSkip={() => submitFollowUp(true)}
                  />
                )}

                {step === "frequency" && (
                  <SingleChoice
                    options={MEET_FREQUENCIES}
                    value={chosenFrequency}
                    onSelect={pickFrequency}
                    customPlaceholder="Etwas anderes? Eigene Angabe"
                  />
                )}

                {step === "profile" && <ProfileForm onSubmit={submitProfile} track={track} />}

                {step === "wishes" && (
                  <LongTextAnswer
                    value={text}
                    onChange={setText}
                    onSubmit={() => submitWishes()}
                    placeholder="Meine Wünsche und Ideen für DSpora …"
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
                      E-Mail-Adresse
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
                      placeholder="deine@mail.com"
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
                      {sending
                        ? "Sende …"
                        : path === "anonymous"
                          ? "Jetzt anonym anmelden"
                          : "Jetzt anmelden & Profil speichern"}
                    </button>
                    <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-500">
                      Kein Passwort nötig. Deine E-Mail-Adresse bleibt für andere unsichtbar.
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
                        ? `Andere Adresse oder erneut senden (in ${cooldown} s)`
                        : "Link erneut senden / andere Adresse"}
                    </Chip>
                  </ChipRow>
                )}

                {step === "retry" && (
                  <ChipRow>
                    <Chip onClick={() => finishSave()}>Erneut versuchen</Chip>
                  </ChipRow>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
