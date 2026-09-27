"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function AiMatchingCard() {
  const { t } = useLanguage();

  return (
    <motion.div
      className="relative mb-12"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
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
              "conic-gradient(from 0deg, #F2A65A 0%, transparent 15%, transparent 85%, #F2A65A 100%)",
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
          <Translated text={t.ai.badge} className="ai-shimmer-text" />
        </span>

        <h3 className="relative mt-5 text-xl font-semibold text-zinc-50 uppercase sm:text-2xl">
          <Translated text={t.ai.heading} />
        </h3>

        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          <Translated text={t.ai.description} />
        </p>
      </div>
    </motion.div>
  );
}
