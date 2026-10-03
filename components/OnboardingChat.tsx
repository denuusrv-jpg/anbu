"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import ProfileForm, { type ProfileResult } from "@/components/onboarding/ProfileForm";
import { Chip, ChipRow, TextAnswer } from "@/components/onboarding/ui";
import {
  FREQUENCIES,
  FRIEND_STYLES,
  GROUP_SIZES,
  INTERESTS,
  LANGUAGES,
  REGIONS,
  VIBES,
  WISHES,
  type Choice,
  type OnboardingAnswers,
  type Option,
} from "@/lib/onboarding";

type Step =
  | "intro"
  | "region"
  | "city"
  | "interests"
  | "vibes"
  | "mode"
  | "profile"
  | "more"
  | "friendStyle"
  | "groupSize"
  | "frequency"
  | "languages"
  | "wishes"
  | "notes"
  | "saving"
  | "retry";

type Message = { id: number; from: "bot" | "user"; text: string };

const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const EMPTY: Choice = { ids: [], custom: [] };
const EXTRA_STEPS: Step[] = ["friendStyle", "groupSize", "frequency", "languages", "wishes", "notes"];

// Fortschritt der vier Kernfragen (Anzeige oben)
const STEP_NUMBER: Partial<Record<Step, number>> = {
  region: 1,
  city: 1,
  interests: 2,
  vibes: 3,
  mode: 4,
  profile: 4,
};

function labelsOf(choice: Choice, options: Option[]) {
  return [
    ...choice.ids.map((id) => options.find((o) => o.id === id)?.label ?? id),
    ...choice.custom,
  ].join(", ");
}

const labelOf = (id: string, options: Option[]) => options.find((o) => o.id === id)?.label ?? id;

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState("");

  // Auswahlen, die in den Panels live bearbeitet werden
  const [interests, setInterests] = useState<Choice>(EMPTY);
  const [vibes, setVibes] = useState<Choice>(EMPTY);
  const [friendStyle, setFriendStyle] = useState<Choice>(EMPTY);
  const [wishes, setWishes] = useState<Choice>(EMPTY);
  const [languages, setLanguages] = useState<Choice>(EMPTY);

  const answers = useRef<Partial<OnboardingAnswers>>({});
  const photos = useRef<Blob[]>([]);
  const token = useRef<string | undefined>(undefined);
  const nextId = useRef(0);
  const alive = useRef(true);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Optionaler Token aus der Warteliste (…/onboarding?token=…)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) token.current = t;
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, step, busy]);

  // Bot-Nachrichten nacheinander einblenden, mit Tipp-Anzeige davor
  async function bot(texts: string[]) {
    setBusy(true);
    for (const message of texts) {
      setTyping(true);
      await sleep(650 + Math.min(message.length * 9, 800));
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
        "Vier kurze Fragen, dann bist du durch. Wo bist du zu Hause?",
      ],
      "region",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Die vier Kernfragen ———

  function pickRegion(option: Option) {
    answers.current.region = option.id;
    user(option.label);
    ask(["Und in welcher Stadt? So finden wir Leute in deiner Nähe. Du kannst auch überspringen."], "city");
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
      [
        "Was begeistert dich? Such dir aus, was passt – und wenn etwas fehlt, trag einfach dein eigenes ein.",
      ],
      "interests",
    );
  }

  function confirmInterests() {
    answers.current.interests = interests;
    user(labelsOf(interests, INTERESTS));
    ask(
      [
        "Und welcher Vibe beschreibt dich am besten? Wähle gern mehrere oder schreib deinen eigenen.",
      ],
      "vibes",
    );
  }

  function confirmVibes() {
    answers.current.vibes = vibes;
    user(labelsOf(vibes, VIBES));
    ask(
      [
        "Letzte der vier Fragen: Möchtest du komplett anonym bleiben – oder ein Profil mit Fotos, Beschreibung und mehr anlegen? Beides ist völlig okay.",
      ],
      "mode",
    );
  }

  function pickMode(mode: "anonymous" | "profile") {
    answers.current.mode = mode;
    if (mode === "anonymous") {
      user("Komplett anonym");
      askMore();
      return;
    }
    user("Profil anlegen");
    ask(
      [
        "Sehr schön! Erzähl ein bisschen von dir. Nur der Anzeigename ist Pflicht, alles andere ist freiwillig – und du bestimmst, wer dein Profil sehen darf.",
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
    askMore();
  }

  // ——— Bonus: weiter chatten für bessere Ergebnisse ———

  function askMore() {
    ask(
      [
        "Das waren die vier Fragen – danke dir! Wenn du Lust hast, chatten wir noch ein bisschen weiter: Je mehr ich über dich weiß, desto besser werden deine Matches. Wie sieht's aus?",
      ],
      "more",
    );
  }

  function extras() {
    answers.current.extras = answers.current.extras ?? {};
    return answers.current.extras;
  }

  function startBonus() {
    user("Ja, gern");
    ask(["Wie bist du im Freundeskreis? Such dir aus, was passt, oder schreib's selbst."], "friendStyle");
  }

  function confirmFriendStyle() {
    extras().friendStyle = friendStyle;
    user(labelsOf(friendStyle, FRIEND_STYLES) || "Überspringen");
    ask(["Wie groß darf deine Gruppe sein?"], "groupSize");
  }

  function pickGroupSize(option?: Option) {
    if (option) extras().groupSize = option.id;
    user(option?.label ?? "Überspringen");
    ask(["Wie oft möchtest du dich mit deiner Gruppe treffen?"], "frequency");
  }

  function pickFrequency(option?: Option) {
    if (option) extras().frequency = option.id;
    user(option?.label ?? "Überspringen");
    ask(["In welchen Sprachen unterhältst du dich am liebsten?"], "languages");
  }

  function confirmLanguages() {
    extras().languagesTogether = languages.ids;
    user(labelsOf(languages, LANGUAGES) || "Überspringen");
    ask(["Was wünschst du dir von neuen Verbindungen?"], "wishes");
  }

  function confirmWishes() {
    extras().wishes = wishes;
    user(labelsOf(wishes, WISHES) || "Überspringen");
    ask(["Letzte Bonusfrage: Gibt es noch etwas, das wir über dich wissen sollten?"], "notes");
  }

  function submitNotes(skip = false) {
    const value = text.trim();
    if (!skip && value.length > 300) {
      setInputError("Maximal 300 Zeichen.");
      return;
    }
    if (!skip && value) extras().more = value;
    user(skip || !value ? "Überspringen" : value);
    finish();
  }

  // ——— Abschluss ———

  async function finish() {
    setStep("intro");
    await bot(["Perfekt, danke dir! Einen Moment, ich lege dein Profil an …"]);
    if (!alive.current) return;
    setStep("saving");
    setBusy(true);
    setTyping(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...answers.current, token: token.current }),
        }),
        sleep(900),
      ]);
      if (!res.ok) throw new Error("save failed");
      setTyping(false);
      await bot(["Du bist startklar!"]);
      await sleep(600);
      if (alive.current) router.push("/onboarding/fertig");
    } catch {
      setTyping(false);
      await bot(["Das hat leider nicht geklappt. Magst du es noch einmal versuchen?"]);
      setStep("retry");
    }
  }

  const stepNumber = STEP_NUMBER[step];
  const isBonus = EXTRA_STEPS.includes(step) || step === "more";
  const showPanel = !busy && step !== "intro" && step !== "saving";
  const progress = isBonus ? 1 : (stepNumber ?? 0) / 4;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:h-[min(780px,calc(100dvh-3rem))] sm:rounded-3xl sm:border">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />

        {/* Kopfzeile */}
        <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            href="/"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Zurück
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(242,166,90,0.9)]" />
            DSpora
          </div>
          <span className="w-14 text-right text-xs text-zinc-500">
            {isBonus ? "Bonus" : stepNumber ? `${stepNumber} / 4` : ""}
          </span>
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
                      : "max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-sm leading-relaxed font-medium text-zinc-950 shadow-[0_8px_20px_-10px_rgba(242,166,90,0.5)]"
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
                {step === "region" && (
                  <ChipRow>
                    {REGIONS.map((r) => (
                      <Chip key={r.id} onClick={() => pickRegion(r)}>
                        {r.label}
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

                {step === "mode" && (
                  <ChipRow>
                    <Chip onClick={() => pickMode("anonymous")}>Komplett anonym</Chip>
                    <Chip onClick={() => pickMode("profile")}>Profil anlegen</Chip>
                  </ChipRow>
                )}

                {step === "profile" && <ProfileForm onSubmit={submitProfile} />}

                {step === "more" && (
                  <ChipRow>
                    <Chip onClick={startBonus}>Ja, gern</Chip>
                    <Chip
                      onClick={() => {
                        user("Reicht mir, fertig");
                        finish();
                      }}
                    >
                      Reicht mir, fertig
                    </Chip>
                  </ChipRow>
                )}

                {step === "friendStyle" && (
                  <ChoiceSelect
                    options={FRIEND_STYLES}
                    value={friendStyle}
                    onChange={setFriendStyle}
                    onConfirm={confirmFriendStyle}
                    customPlaceholder="Eigenes hinzufügen"
                    minTotal={0}
                  />
                )}

                {step === "groupSize" && (
                  <ChipRow>
                    {GROUP_SIZES.map((g) => (
                      <Chip key={g.id} onClick={() => pickGroupSize(g)}>
                        {g.label}
                      </Chip>
                    ))}
                    <Chip subtle onClick={() => pickGroupSize()}>
                      Überspringen
                    </Chip>
                  </ChipRow>
                )}

                {step === "frequency" && (
                  <ChipRow>
                    {FREQUENCIES.map((f) => (
                      <Chip key={f.id} onClick={() => pickFrequency(f)}>
                        {f.label}
                      </Chip>
                    ))}
                    <Chip subtle onClick={() => pickFrequency()}>
                      Überspringen
                    </Chip>
                  </ChipRow>
                )}

                {step === "languages" && (
                  <ChoiceSelect
                    options={LANGUAGES}
                    value={languages}
                    onChange={setLanguages}
                    onConfirm={confirmLanguages}
                    customPlaceholder=""
                    allowCustom={false}
                    minTotal={0}
                  />
                )}

                {step === "wishes" && (
                  <ChoiceSelect
                    options={WISHES}
                    value={wishes}
                    onChange={setWishes}
                    onConfirm={confirmWishes}
                    customPlaceholder="Eigenen Wunsch hinzufügen"
                    minTotal={0}
                  />
                )}

                {step === "notes" && (
                  <TextAnswer
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={() => submitNotes()}
                    placeholder="Dein Gedanke (optional)"
                    maxLength={300}
                    error={inputError}
                    extra={
                      <Chip onClick={() => submitNotes(true)} subtle>
                        Überspringen
                      </Chip>
                    }
                  />
                )}

                {step === "retry" && (
                  <ChipRow>
                    <Chip onClick={() => finish()}>Erneut versuchen</Chip>
                  </ChipRow>
                )}

                {EXTRA_STEPS.includes(step) && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        user("Jetzt abschließen");
                        finish();
                      }}
                      className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      Jetzt abschließen
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
