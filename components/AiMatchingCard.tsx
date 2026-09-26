"use client";

import { motion } from "motion/react";

export default function AiMatchingCard() {
  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl sm:px-12">
      {/* Dezentes Leuchten */}
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <span className="relative inline-flex items-center rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 text-[10px] font-semibold tracking-wide text-gold uppercase">
        Powered by AI
      </span>

      <h3 className="relative mt-5 text-xl font-semibold text-zinc-50 uppercase sm:text-2xl">
        Der KI-Persönlichkeits-Check
      </h3>

      <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
        Keine starren Fragebögen. Du führst ein entspanntes Gespräch mit
        unserer künstlichen Intelligenz – wie lange es dauert, liegt ganz bei
        dir. Sie versteht deinen Humor und deine Interessen und findet so
        dein perfektes Match für Duo, Crew oder Squad.
      </p>
    </div>
  );
}
