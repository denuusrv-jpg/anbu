"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatIcon, CheckIcon, GlobeIcon, ShieldIcon } from "@/components/Icons";
import SlideToSend from "@/components/SlideToSend";

type Topic = "allgemein" | "events" | "presse" | "sicherheit";
type Status = "idle" | "success";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

const topics: { id: Topic; label: string; Icon: typeof ChatIcon }[] = [
  { id: "allgemein", label: "Allgemeine Frage", Icon: ChatIcon },
  { id: "events", label: "Event beantragen", Icon: CheckIcon },
  { id: "presse", label: "Presse & Partnerschaften", Icon: GlobeIcon },
  { id: "sicherheit", label: "Sicherheit & Support", Icon: ShieldIcon },
];

export default function ContactForm() {
  const [topic, setTopic] = useState<Topic>("allgemein");

  // Aus dem Bereich "Events" kommt man mit vorgewähltem Thema hierher
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("thema") === "events") setTopic("events");
  }, []);
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [slideKey, setSlideKey] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  function pickFile(f: File | undefined) {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Bitte wähle eine PDF-Datei.");
    } else if (f.size > MAX_PDF_BYTES) {
      setError("Die PDF-Datei ist größer als 5 MB.");
    } else {
      setFile(f);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  // Senden: Nachricht (und PDF) gehen als E-Mail an uns. Bei einem Fehler springt der Schieber zurück.
  async function send() {
    setError("");
    try {
      const data = new FormData();
      data.set("topic", topic);
      data.set("name", name);
      data.set("email", email);
      data.set("message", message);
      data.set("website", honeypot.current?.value ?? "");
      data.set("elapsed", String(Date.now() - shownAt.current));
      if (file) data.set("file", file);
      const res = await fetch("/api/contact", { method: "POST", body: data, signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        setStatus("success");
        return;
      }
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Das hat leider nicht geklappt. Bitte versuch es noch einmal.");
    } catch {
      setError("Keine Verbindung. Bitte versuch es noch einmal.");
    }
    setSlideKey((k) => k + 1);
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim().length > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-10">
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full glow-gold"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <div className="relative">
        {/* Themenwahl */}
        {/* Handy: Thema per Dropdown */}
        <div className="relative sm:hidden">
          <label htmlFor="topic" className="sr-only">
            Thema
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic)}
            className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/70 py-3.5 pr-11 pl-4 text-sm font-medium text-white focus:border-gold focus:outline-none"
          >
            {topics.map(({ id, label }) => (
              <option key={id} value={id} className="bg-zinc-900 text-white">
                {label}
              </option>
            ))}
          </select>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-gold" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <div className="hidden flex-wrap justify-center gap-2 sm:flex">
          {topics.map(({ id, label, Icon }) => {
            const active = topic === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTopic(id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                  active
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {status === "success" ? (
            <motion.div
              key="success"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3 py-14 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <CheckIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50">
                Danke für deine Nachricht!
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-300">
                Wir melden uns so schnell wie möglich bei dir zurück.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="name" className="text-xs font-medium text-zinc-300">
                    Name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                    placeholder="Wie dürfen wir dich nennen?"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-medium text-zinc-300">
                    Deine E-Mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                    placeholder="deine@mail.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="message" className="text-xs font-medium text-zinc-300">
                  Deine Nachricht
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                  placeholder="Erzähl uns, worum es geht …"
                />
              </div>

              {/* PDF anhängen (optional) */}
              <div className="flex flex-col gap-1.5 text-left">
                <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="pointer-events-none absolute h-0 w-0 opacity-0" />
                <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} aria-label="PDF-Datei auswählen" />
                <span className="text-xs font-medium text-zinc-300">PDF anhängen (optional, bis 5 MB)</span>
                {file ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/[0.07] px-4 py-3 text-sm text-zinc-100">
                    <span className="flex min-w-0 items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M7 3h7l5 5v13H7z" />
                        <path d="M14 3v5h5" />
                      </svg>
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button type="button" onClick={() => setFile(null)} aria-label="PDF entfernen" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-zinc-300 transition-colors hover:text-rose">
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-gold/50 hover:text-gold"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 12.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" />
                    </svg>
                    PDF auswählen
                  </button>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-rose">
                  {error}
                </p>
              )}

              <div className="mt-2">
                <SlideToSend key={slideKey} label="Zum Senden schieben" disabled={!isValid} onSuccess={send} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
