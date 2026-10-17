"use client";

import { useEffect } from "react";

// Solange ein Fenster (Anmelden, Pop-up, Hinweis) offen ist, bleibt die Seite dahinter stehen. Auf dem iPhone reicht
// "overflow: hidden" nicht, deshalb wird die Seite festgesetzt und danach an dieselbe Stelle zurückgesetzt.
// Mehrere Fenster gleichzeitig sind möglich (Zähler).
let locks = 0;
let saved: { y: number; position: string; top: string; left: string; right: string; overflow: string; paddingRight: string } | null = null;

function lock() {
  if (locks++ > 0) return;
  const body = document.body;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  saved = {
    y: window.scrollY,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };
  body.style.position = "fixed";
  body.style.top = `-${saved.y}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.overflow = "hidden";
  // Am Desktop verschwindet mit der Scrollleiste Platz: ausgleichen, damit nichts springt
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlock() {
  if (--locks > 0 || !saved) return;
  const body = document.body;
  const s = saved;
  saved = null;
  body.style.position = s.position;
  body.style.top = s.top;
  body.style.left = s.left;
  body.style.right = s.right;
  body.style.overflow = s.overflow;
  body.style.paddingRight = s.paddingRight;
  window.scrollTo({ top: s.y, behavior: "instant" as ScrollBehavior });
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
