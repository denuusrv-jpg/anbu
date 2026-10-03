"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import LoginCard from "@/components/LoginCard";

export const OPEN_LOGIN_EVENT = "dspora:open-login";

// Globales Anmelde-Fenster: öffnet sich über das Event (Klick auf "Anmelden").
export default function LoginGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openGate = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(OPEN_LOGIN_EVENT, openGate);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_LOGIN_EVENT, openGate);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/55 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Anmelden"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <LoginCard next="/hub" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
