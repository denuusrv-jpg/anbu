"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Ruhiger Seitenwechsel: die alte Seite blendet schnell aus, die neue blendet
// weich ein und setzt sich dabei minimal von unten an ihren Platz.
type Phase = "idle" | "exit" | "enter-start" | "enter";

const EXIT_MS = 180;
const ENTER_MS = 380;
const EXIT_EASE = "cubic-bezier(0.4, 0, 1, 1)";
const ENTER_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const prevPathname = useRef(pathname);
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function changePhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function startEnter() {
    clearTimers();
    changePhase("enter-start");
    // kurz warten, damit der Startzustand (unsichtbar, leicht tiefer) gerendert ist
    later(() => changePhase("enter"), 30);
    later(() => changePhase("idle"), 30 + ENTER_MS + 20);
  }

  // Interne Link-Klicks abfangen: erst ausblenden, dann navigieren
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduceMotion.matches || phaseRef.current !== "idle") return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();

      clearTimers();
      changePhase("exit");

      later(() => router.push(url.pathname + url.search + url.hash), EXIT_MS);
      // Sicherheitsnetz, falls die Navigation nie ankommt
      later(startEnter, EXIT_MS + 4000);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Neue Seite ist da: einblenden (nur wenn die alte gerade ausgeblendet wurde)
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (phaseRef.current !== "exit") return;
    startEnter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, []);

  let style: React.CSSProperties | undefined;
  switch (phase) {
    case "exit":
      style = {
        opacity: 0,
        transition: `opacity ${EXIT_MS}ms ${EXIT_EASE}`,
        pointerEvents: "none",
      };
      break;
    case "enter-start":
      style = {
        opacity: 0,
        transform: "translate3d(0, 10px, 0)",
        transition: "none",
        pointerEvents: "none",
      };
      break;
    case "enter":
      style = {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        transition: `opacity ${ENTER_MS}ms ${ENTER_EASE}, transform ${ENTER_MS}ms ${ENTER_EASE}`,
      };
      break;
    default:
      // Im Ruhezustand keine Transform-Eigenschaft, damit nichts einen eigenen Stacking-Kontext bekommt
      style = undefined;
  }

  return (
    <div style={style && { ...style, willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}
