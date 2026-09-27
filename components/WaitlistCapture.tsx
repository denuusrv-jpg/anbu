"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon } from "@/components/Icons";
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

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative isolate overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
          <motion.div
            className="absolute inset-y-0 left-0 -z-10 bg-gradient-to-r from-gold to-gold-light"
            initial={{ width: "0%" }}
            animate={{ width: status === "idle" ? "0%" : "100%" }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
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
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-zinc-950"
              >
                <CheckIcon className="h-4 w-4" />
                <Translated text={t.waitlistCapture.success} />
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
                  className="w-full bg-transparent py-3.5 pr-2 pl-6 text-sm text-white placeholder:text-white/60 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="m-1.5 flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-zinc-950 transition hover:bg-gold-light disabled:opacity-70"
                >
                  <Translated text={t.waitlistCapture.button} />
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
