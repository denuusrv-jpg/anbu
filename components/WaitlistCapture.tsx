"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon, RetryIcon } from "@/components/Icons";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

type Status = "idle" | "loading" | "success";

export default function WaitlistCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const { t, language } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("loading");
  }

  function handleRetry() {
    setEmail("");
    setStatus("idle");
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
          <motion.div
            className="absolute inset-y-0 left-0 -z-10 bg-gradient-to-r from-gold to-gold-light"
            initial={{ width: "0%" }}
            animate={{ width: status === "idle" ? "0%" : "100%" }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => {
              if (status === "loading") setStatus("success");
            }}
          />

          <AnimatePresence mode="wait" initial={false}>
            {status === "success" ? (
              <motion.div
                key="success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center"
              >
                <div className="flex flex-1 items-center justify-center gap-2 py-3.5 pr-2 pl-6 text-sm font-semibold text-zinc-950">
                  <CheckIcon className="h-4 w-4 shrink-0" />
                  <Translated text={t.waitlistCapture.success} />
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  aria-label={t.waitlistCapture.retry}
                  title={t.waitlistCapture.retry}
                  className="group m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950/15 text-zinc-950 transition hover:scale-105 hover:bg-zinc-950/25 active:scale-95"
                >
                  <RetryIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-90" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <label htmlFor="waitlist-capture-email" className="sr-only">
                  {t.waitlistCapture.placeholder}
                </label>
                <input
                  id="waitlist-capture-email"
                  type="email"
                  required
                  disabled={status === "loading"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.waitlistCapture.placeholder}
                  key={language}
                  className="w-full bg-transparent py-3.5 pr-2 pl-6 text-sm text-white placeholder:text-white/60 focus:outline-none disabled:opacity-80"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  aria-label={t.waitlistCapture.button}
                  className="group m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-zinc-950 transition hover:scale-105 hover:bg-gold-light active:scale-95 disabled:opacity-70"
                >
                  <ArrowRightIcon className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
