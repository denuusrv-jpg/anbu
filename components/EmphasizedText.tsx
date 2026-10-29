"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

// Wie "Translated" (weiches Einblenden beim Sprachwechsel), hebt aber "100 % kostenlos und anonym" fett hervor.
const PHRASE = /100\s?%\s\S+(?:\s(?:und|and|மற்றும்)\s\S+)?/;

export default function EmphasizedText({ text }: { text: string }) {
  const { language } = useLanguage();
  const match = PHRASE.exec(text);
  const parts = match
    ? [text.slice(0, match.index), match[0], text.slice(match.index + match[0].length)]
    : [text, "", ""];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={language + text}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(8px)" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ display: "inline-block" }}
      >
        {parts[0]}
        {parts[1] && <strong className="font-semibold text-white">{parts[1]}</strong>}
        {parts[2]}
      </motion.span>
    </AnimatePresence>
  );
}
