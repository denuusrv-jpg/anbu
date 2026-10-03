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
        className="cta-premium inline-flex items-center rounded-full bg-gradient-to-b from-gold-light to-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.35),0_10px_24px_-12px_rgba(242,166,90,0.45)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.35),0_16px_32px_-14px_rgba(242,166,90,0.5)] active:translate-y-0 active:duration-100"
      >
        <Translated text={t.cta.signUp} />
      </button>
    </motion.div>
  );
}
