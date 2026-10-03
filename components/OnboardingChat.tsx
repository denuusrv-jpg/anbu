"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon } from "@/components/Icons";
import {
  ALIAS_PATTERN,
  INTERESTS,
  MAX_INTERESTS,
  REGIONS,
  VIBES,
  type OnboardingAnswers,
} from "@/lib/onboarding";

type Step =
  | "intro"
  | "region"
  | "city"
  | "interests"
  | "vibe"
  | "mode"
  | "alias"
  | "saving"
  | "retry";

type Message = { id: number; from: "bot" | "user"; text: string };

const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fortschritt der vier Fragen (für die Anzeige oben)
const STEP_NUMBER: Partial<Record<Step, number>> = {
  region: 1,
  city: 1,
  interests: 2,
  vibe: 3,
  mode: 4,
  alias: 4,
  saving: 4,
  retry: 4,
};

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState("");

  const answers = useRef<Partial<OnboardingAnswers>>({});
  const token = useRef<string | undefined>(undefined);
  const nextId = useRef(0);
  const alive = useRef(true);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      await sleep(650 + Math.min(message.length * 9, 750));
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

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      await bot([
        "Willkommen bei DSpora. Lass uns herausfinden, wer wirklich zu dir passt – ganz anonym und in deinem Tempo.",
        "Vier kurze Fragen, dann bist du durch. Wo bist du zu Hause?",
      ]);
      if (alive.current) setStep("region");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickRegion(id: string, label: string) {
    answers.current.region = id;
    user(label);
    setStep("intro");
    await bot([
      "Und in welcher Stadt? So finden wir Leute in deiner Nähe. Du kannst auch überspringen.",
    ]);
    setStep("city");
  }

  async function submitCity(skip = false) {
    const value = text.trim();
    if (!skip && value.length > 60) {
      setInputError("Maximal 60 Zeichen.");
      return;
    }
    answers.current.city = skip || !value ? undefined : value;
    user(skip || !value ? "Überspringen" : value);
    setText("");
    setInputError("");
    setStep("intro");
    await bot(["Was begeistert dich? Such dir aus, was passt – gern mehrere."]);
    setStep("interests");
  }

  function toggleInterest(id: string) {
    setSelectedInterests((current) => {
      if (current.includes(id)) return current.filter((i) => i !== id);
      if (current.length >= MAX_INTERESTS) return current;
      return [...current, id];
    });
  }

  async function confirmInterests() {
    if (selectedInterests.length === 0) return;
    answers.current.interests = selectedInterests;
    user(
      selectedInterests
        .map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id)
        .join(", "),
    );
    setStep("intro");
    await bot(["Und welcher Vibe beschreibt dich am besten?"]);
    setStep("vibe");
  }

  async function pickVibe(id: string, label: string) {
    answers.current.vibe = id;
    user(label);
    setStep("intro");
    await bot([
      "Letzte Frage: Möchtest du komplett anonym bleiben oder mit einem Pseudonym starten?",
    ]);
    setStep("mode");
  }

  async function pickMode(mode: "anonymous" | "pseudonym") {
    answers.current.mode = mode;
    if (mode === "anonymous") {
      user("Komplett anonym");
      setStep("intro");
      await finish();
      return;
    }
    user("Mit Pseudonym");
    setStep("intro");
    await bot([
      "Wie sollen dich die anderen nennen? Ein echter Name ist nicht nötig.",
    ]);
    setStep("alias");
  }

  async function submitAlias() {
    const value = text.trim();
    if (!ALIAS_PATTERN.test(value)) {
      setInputError("2 bis 24 Zeichen: Buchstaben, Zahlen, Leerzeichen, _ . -");
      return;
    }
    answers.current.alias = value;
    user(value);
    setText("");
    setInputError("");
    setStep("intro");
    await finish();
  }

  async function finish() {
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
  const showPanel = !busy && step !== "intro" && step !== "saving";

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
            {stepNumber ? `${Math.min(stepNumber, 4)} / 4` : ""}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/5">
            <motion.div
              className="h-full bg-gold/70"
              initial={false}
              animate={{ width: `${((stepNumber ?? 0) / 4) * 100}%` }}
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
        <div className="relative min-h-[88px] border-t border-white/10 bg-zinc-950/30 px-4 py-4 sm:px-6">
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
                      <Chip key={r.id} onClick={() => pickRegion(r.id, r.label)}>
                        {r.label}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "city" && (
                  <TextAnswer
                    inputRef={inputRef}
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
                  <div className="space-y-3">
                    <ChipRow>
                      {INTERESTS.map((i) => (
                        <Chip
                          key={i.id}
                          selected={selectedInterests.includes(i.id)}
                          onClick={() => toggleInterest(i.id)}
                        >
                          {i.label}
                        </Chip>
                      ))}
                    </ChipRow>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">
                        {selectedInterests.length === 0
                          ? "Wähle mindestens eins"
                          : `${selectedInterests.length} gewählt`}
                      </span>
                      <button
                        type="button"
                        onClick={confirmInterests}
                        disabled={selectedInterests.length === 0}
                        className="cta-premium inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
                      >
                        Weiter
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === "vibe" && (
                  <ChipRow>
                    {VIBES.map((v) => (
                      <Chip key={v.id} onClick={() => pickVibe(v.id, v.label)}>
                        {v.label}
                      </Chip>
                    ))}
                  </ChipRow>
                )}

                {step === "mode" && (
                  <ChipRow>
                    <Chip onClick={() => pickMode("anonymous")}>Komplett anonym</Chip>
                    <Chip onClick={() => pickMode("pseudonym")}>Mit Pseudonym</Chip>
                  </ChipRow>
                )}

                {step === "alias" && (
                  <TextAnswer
                    inputRef={inputRef}
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      setInputError("");
                    }}
                    onSubmit={submitAlias}
                    placeholder="Dein Pseudonym"
                    error={inputError}
                  />
                )}

                {step === "retry" && (
                  <ChipRow>
                    <Chip onClick={() => finish()}>Erneut versuchen</Chip>
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

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  children,
  onClick,
  selected = false,
  subtle = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-[border-color,background-color,color,transform] duration-300 active:scale-95 ${
        selected
          ? "border-gold/60 bg-gold/15 text-gold"
          : subtle
            ? "border-transparent bg-transparent text-zinc-500 hover:text-zinc-300"
            : "border-white/10 bg-white/5 text-zinc-200 hover:border-gold/50 hover:text-gold"
      }`}
    >
      {selected && <CheckIcon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function TextAnswer({
  inputRef,
  value,
  onChange,
  onSubmit,
  placeholder,
  error,
  extra,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  error: string;
  extra?: React.ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-1.5 focus-within:border-gold/60">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          maxLength={60}
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        {extra}
        <button
          type="submit"
          aria-label="Senden"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:bg-gold-light active:scale-95"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="px-1 text-xs text-rose">
          {error}
        </p>
      )}
    </form>
  );
}
