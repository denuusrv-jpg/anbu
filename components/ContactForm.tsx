"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatIcon, CheckIcon, GlobeIcon, ShieldIcon } from "@/components/Icons";

type Topic = "allgemein" | "presse" | "sicherheit";
type Status = "idle" | "loading" | "success";

const topics: { id: Topic; label: string; Icon: typeof ChatIcon }[] = [
  { id: "allgemein", label: "Allgemeine Frage", Icon: ChatIcon },
  { id: "presse", label: "Presse & Partnerschaften", Icon: GlobeIcon },
  { id: "sicherheit", label: "Sicherheit & Support", Icon: ShieldIcon },
];

export default function ContactForm() {
  const [topic, setTopic] = useState<Topic>("allgemein");
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("loading");
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-10">
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <div className="relative">
        {/* Themenwahl */}
        <div className="flex flex-wrap justify-center gap-2">
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
              <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                Wir melden uns so schnell wie möglich bei dir zurück.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="name" className="text-xs font-medium text-zinc-400">
                    Name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    disabled={status === "loading"}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none disabled:opacity-60"
                    placeholder="Wie dürfen wir dich nennen?"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-medium text-zinc-400">
                    Deine E-Mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={status === "loading"}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none disabled:opacity-60"
                    placeholder="deine@mail.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="message" className="text-xs font-medium text-zinc-400">
                  Deine Nachricht
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  disabled={status === "loading"}
                  className="resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none disabled:opacity-60"
                  placeholder="Erzähl uns, worum es geht …"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="relative mt-2 overflow-hidden rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light disabled:opacity-90"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gold-light"
                  initial={{ width: "0%" }}
                  animate={{ width: status === "loading" ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                  onAnimationComplete={() => {
                    if (status === "loading") setStatus("success");
                  }}
                />
                <span className="relative">
                  {status === "loading" ? "Wird gesendet …" : "Nachricht senden"}
                </span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
