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
        className="inline-flex items-center rounded-full bg-gradient-to-b from-gold-light to-gold px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.4),0_8px_20px_-10px_rgba(242,166,90,0.5)] transition-[transform,box-shadow,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(0,0,0,0.4),0_14px_28px_-12px_rgba(242,166,90,0.55)] active:translate-y-0 active:brightness-95 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.4)]"
      >
        <Translated text={t.cta.signUp} />
      </button>
    </motion.div>
  );
}
