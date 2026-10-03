"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// macOS-Fensterwechsel: die alte Seite blendet aus und schrumpft leicht (100 → 98 %),
// die neue kommt leicht vergrößert (102 %) und setzt sich auf 100 % zurück.
type Phase = "idle" | "exit" | "enter-start" | "enter";

const DURATION_MS = 350;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const TRANSITION = `opacity ${DURATION_MS}ms ${EASE}, transform ${DURATION_MS}ms ${EASE}`;

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [origin, setOrigin] = useState("50% 50%");
  const prevPathname = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Skaliert um die Mitte des sichtbaren Ausschnitts, nicht um die Mitte der ganzen Seite
  function viewportOrigin() {
    return `50% ${window.scrollY + window.innerHeight / 2}px`;
  }

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function finish() {
    setPhase("idle");
    document.documentElement.style.overflowX = "";
  }

  // Interne Link-Klicks abfangen: erst ausblenden, dann navigieren
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduceMotion.matches) return;

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
      document.documentElement.style.overflowX = "clip";
      setOrigin(viewportOrigin());
      setPhase("exit");

      later(() => router.push(url.pathname + url.search + url.hash), DURATION_MS);
      // Sicherheitsnetz, falls die Navigation nie ankommt
      later(finish, 4000);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Neue Seite ist da: von 102 % auf 100 % einblenden (Layout-Effect, damit kein Frame in voller Deckkraft aufblitzt)
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    clearTimers();
    document.documentElement.style.overflowX = "clip";
    setOrigin(viewportOrigin());
    setPhase("enter-start");
    // kurz warten, damit der Startzustand (102 %, unsichtbar) gerendert ist
    later(() => setPhase("enter"), 30);
    later(finish, 30 + DURATION_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, []);

  let style: React.CSSProperties | undefined;
  switch (phase) {
    case "exit":
      style = {
        opacity: 0,
        transform: "scale(0.98)",
        transition: TRANSITION,
        pointerEvents: "none",
      };
      break;
    case "enter-start":
      style = {
        opacity: 0,
        transform: "scale(1.02)",
        transition: "none",
        pointerEvents: "none",
      };
      break;
    case "enter":
      style = {
        opacity: 1,
        transform: "scale(1)",
        transition: TRANSITION,
      };
      break;
    default:
      // Im Ruhezustand keine Transform-Eigenschaft, damit nichts einen eigenen Stacking-Kontext bekommt
      style = undefined;
  }

  return (
    <div
      data-page-transition={phase}
      style={
        style && {
          ...style,
          transformOrigin: origin,
          willChange: "opacity, transform",
        }
      }
    >
      {children}
    </div>
  );
}
