"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Translated({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { language } = useLanguage();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={language + text}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(8px)" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={className}
        style={{ display: "inline-block" }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
