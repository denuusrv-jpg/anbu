"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon } from "@/components/Icons";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";
import SlideToSend from "@/components/SlideToSend";

type Status = "idle" | "success";

export default function WaitlistCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const { t, language } = useLanguage();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="mx-auto w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.div
            key="success"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-gold backdrop-blur-xl"
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
            className="flex flex-col gap-3"
          >
            <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
              <label htmlFor="waitlist-capture-email" className="sr-only">
                {t.waitlistCapture.placeholder}
              </label>
              <input
                id="waitlist-capture-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.waitlistCapture.placeholder}
                key={language}
                className="w-full bg-transparent px-6 py-3.5 text-center text-sm text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>

            <SlideToSend
              label={t.waitlistCapture.slideLabel}
              sendingLabel={t.waitlistCapture.sending}
              disabled={!isValidEmail}
              onSuccess={() => setStatus("success")}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mx-auto mt-6 block w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl">
        <Translated text={t.waitlist.note} />
      </p>
    </div>
  );
}
