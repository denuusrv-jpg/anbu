"use client";

import { motion } from "motion/react";
import { ArrowRightIcon } from "@/components/Icons";

export default function SignUpCta() {
  function scrollToHero() {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        onClick={scrollToHero}
        className="group inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_-6px_rgba(242,166,90,0.7)] transition hover:bg-gold-light hover:shadow-[0_0_32px_-4px_rgba(242,166,90,0.9)]"
      >
        Melde dich jetzt an
        <ArrowRightIcon className="h-4 w-4 -rotate-90 transition-transform group-hover:-translate-y-0.5" />
      </button>
    </motion.div>
  );
}
