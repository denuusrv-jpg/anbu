"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useTx } from "@/lib/LanguageContext";
import { scrollFieldIntoView } from "@/lib/scrollIntoViewOnFocus";
import { useScrollLock } from "@/lib/useScrollLock";

const EASE = [0.16, 1, 0.3, 1] as const;

// Pop-up: auf dem Handy ein Fenster von unten (Bottom-Sheet), am Desktop mittig. Schließt per Tippen daneben, Esc oder Knopf.
export default function Sheet({
  open,
  onClose,
  title,
  children,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const tx = useTx();
  const titleId = useId();
  useScrollLock(open);
  // Wird an document.body gehängt: Karten mit Weichzeichner/Transform würden sonst das "fixed" einschließen
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Handy: Das Pop-up endet über der Tastatur (sichtbare Höhe), damit Eingabefelder nicht verdeckt werden
  const [view, setView] = useState<{ top: number; height: number } | null>(null);
  // Breite Bildschirme: Pop-up in der Mitte, das einblendet statt von unten hereinzufahren
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setWide(mq.matches);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setView({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 z-[140] flex items-end justify-center bg-black/65 sm:items-center sm:p-6"
          style={view ? { top: view.top, height: view.height } : { top: 0, bottom: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={wide ? { opacity: 0, y: 16, scale: 0.97 } : { y: "100%" }}
            animate={wide ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
            exit={wide ? { opacity: 0, y: 8, scale: 0.98 } : { y: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[92%] w-full max-w-lg flex-col rounded-t-3xl border bg-zinc-900 shadow-[0_-30px_80px_-30px_rgba(0,0,0,0.9)] sm:rounded-3xl ${
              tone === "danger" ? "border-rose/30" : "border-white/10"
            }`}
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
            <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-2">
              <h2 id={titleId} className={`text-lg font-semibold ${tone === "danger" ? "text-rose" : "text-zinc-50"}`}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={tx("Schließen")}
                className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-zinc-300 transition-colors hover:text-white"
              >
                ×
              </button>
            </div>
            <div onFocusCapture={scrollFieldIntoView} className="overflow-y-auto overscroll-contain px-6 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
