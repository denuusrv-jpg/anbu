"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function SignUpCta() {
  const { t } = useLanguage();

  function scrollToErfahreMehr() {
    document
      .getElementById("erfahre-mehr")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <motion.div
      className="mt-16 flex justify-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={scrollToErfahreMehr}
        className="inline-flex items-center rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_-6px_rgba(242,166,90,0.7)] transition hover:bg-gold-light hover:shadow-[0_0_32px_-4px_rgba(242,166,90,0.9)]"
      >
        <Translated text={t.cta.signUp} />
      </button>
    </motion.div>
  );
}
