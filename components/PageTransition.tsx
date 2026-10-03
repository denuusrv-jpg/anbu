"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Glass-Blur-Crossfade: Glas-Karten bleiben stehen, nur ihr Inhalt blendet über
// (Regeln in globals.css, Attribut data-page-transition), und ein Blur-Schleier
// über der ganzen Seite zieht für einen Moment an (Schärfentiefe-Effekt).
type Phase = "idle" | "exit" | "enter-start" | "enter";

const DURATION_MS = 300;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const BLUR_PX = 6;

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const prevPathname = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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
      setPhase("exit");

      later(() => router.push(url.pathname + url.search + url.hash), DURATION_MS);
      // Sicherheitsnetz, falls die Navigation nie ankommt
      later(finish, 4000);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Neue Seite ist da: Inhalt blendet ein, Blur löst sich (Layout-Effect, damit kein Frame in voller Deckkraft aufblitzt)
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    clearTimers();
    document.documentElement.style.overflowX = "clip";
    setPhase("enter-start");
    // kurz warten, damit der Startzustand (Inhalt unsichtbar, Blur voll) gerendert ist
    later(() => setPhase("enter"), 30);
    later(finish, 30 + DURATION_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, []);

  const blur =
    phase === "idle" ? "none" : `blur(${phase === "enter" ? 0 : BLUR_PX}px)`;
  const overlayStyle: React.CSSProperties = {
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    transition:
      phase === "exit" || phase === "enter"
        ? `backdrop-filter ${DURATION_MS}ms ${EASE}, -webkit-backdrop-filter ${DURATION_MS}ms ${EASE}`
        : "none",
  };

  return (
    <>
      <div
        data-page-transition={phase}
        style={phase === "exit" ? { pointerEvents: "none" } : undefined}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100]"
        style={overlayStyle}
      />
    </>
  );
}
