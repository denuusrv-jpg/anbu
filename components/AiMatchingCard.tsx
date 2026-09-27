"use client";

import { motion } from "motion/react";

export default function AiMatchingCard() {
  return (
    <div className="relative mb-12">
      {/* Rotierende KI-Aura hinter der Karte */}
      <motion.div
        className="pointer-events-none absolute -inset-2 overflow-hidden rounded-[2rem]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.7 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1 }}
      >
        <div
          className="animate-spin-slow absolute top-1/2 left-1/2 h-[1200px] w-[1200px] blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #F2A65A 12%, transparent 28%, transparent 55%, #F7C08A 70%, transparent 88%)",
          }}
        />
      </motion.div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl sm:px-12">
        {/* Dezentes Leuchten */}
        <motion.div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 rounded-full bg-gold/20 blur-3xl"
          style={{ x: "-50%" }}
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <span className="relative inline-flex items-center rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 text-[10px] font-semibold tracking-wide uppercase">
          <span className="ai-shimmer-text">Powered by AI</span>
        </span>

        <h3 className="relative mt-5 text-xl font-semibold text-zinc-50 uppercase sm:text-2xl">
          Der KI-Persönlichkeits-Check
        </h3>

        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Keine starren Fragebögen. Du führst ein entspanntes Gespräch mit
          unserer künstlichen Intelligenz – wie lange es dauert, liegt ganz
          bei dir. Sie versteht deinen Humor und deine Interessen und findet
          so dein perfektes Match für Duo, Crew oder Squad.
        </p>
      </div>
    </div>
  );
}
