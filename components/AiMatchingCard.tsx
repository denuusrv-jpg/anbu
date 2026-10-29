"use client";

import { motion, Variants } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

const cardVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const auraVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.7, transition: { duration: 0.8, ease: "easeOut" } },
};

const glowVariant: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export default function AiMatchingCard() {
  const { t, language } = useLanguage();

  return (
    <motion.div
      className="relative mb-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={cardVariants}
    >
      {/* Rotierende KI-Aura hinter der Karte */}
      <motion.div
        className="pointer-events-none absolute -inset-2 overflow-hidden rounded-[2rem]"
        variants={auraVariant}
      >
        <div
          className="animate-spin-slow absolute top-1/2 left-1/2 h-[1200px] w-[1200px] blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, #F2A65A 0%, transparent 15%, transparent 85%, #F2A65A 100%)",
          }}
        />
      </motion.div>

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl [container-type:inline-size] sm:px-12"
        variants={cardVariant}
      >
        {/* Dezentes Leuchten */}
        <motion.div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 rounded-full glow-gold"
          style={{ x: "-50%" }}
          variants={glowVariant}
        />

        <span className="relative inline-flex items-center rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 text-[10px] font-semibold tracking-wide uppercase">
          <Translated text={t.ai.badge} className="ai-shimmer-text" />
        </span>

        <h3
          className={`relative mt-5 font-semibold text-zinc-50 uppercase sm:text-2xl sm:leading-normal sm:whitespace-normal ${
            language === "ta" ? "text-xl" : language === "en" ? "text-[15.05cqw] leading-none whitespace-nowrap" : "text-[14.6cqw] leading-none whitespace-nowrap"
          }`}
        >
          <span className="sm:hidden">
            <Translated text={t.ai.headingMobile ?? t.ai.heading} />
          </span>
          <span className="hidden sm:inline">
            <Translated text={t.ai.heading} />
          </span>
        </h3>

        {/* Handy: Blocksatz, Schriftgröße folgt der Kartenbreite, damit der Text auf jedem iPhone gleich umbricht */}
        <p
          className={`relative mx-auto mt-3 max-w-xl text-justify text-[5.05cqw] leading-relaxed text-zinc-300 [hyphens:auto] ${
            language === "ta" ? "[text-align-last:start]" : "[text-align-last:justify]"
          } sm:text-center sm:text-base sm:[hyphens:manual] sm:[text-align-last:auto]`}
        >
          <span className="sm:hidden">
            <Translated text={t.ai.descriptionMobile ?? t.ai.description} />
          </span>
          <span className="hidden sm:inline">
            <Translated text={t.ai.description} />
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
