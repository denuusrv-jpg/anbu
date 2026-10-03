"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Schwarze Wand: steigt von unten auf und verdeckt alles, die neue Seite entsteht
// dahinter, danach zieht die Wand nach oben weiter ab und gibt sie frei.
type Phase = "idle" | "cover" | "reveal";

const COVER_MS = 440;
const REVEAL_MS = 500;
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
// Glas-Lippen ragen über und unter die Wand hinaus, daher etwas mehr Weg
const HIDDEN_BELOW = "translate3d(0, calc(100% + 140px), 0)";
const HIDDEN_ABOVE = "translate3d(0, calc(-100% - 140px), 0)";

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

  function startReveal() {
    clearTimers();
    changePhase("reveal");
    later(() => changePhase("idle"), REVEAL_MS + 50);
  }

  // Interne Link-Klicks abfangen: erst Wand hochfahren, dann navigieren
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
      changePhase("cover");

      later(
        () => router.push(url.pathname + url.search + url.hash),
        COVER_MS,
      );
      // Sicherheitsnetz, falls die Navigation nie ankommt
      later(startReveal, COVER_MS + 4000);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Neue Seite ist da: Wand zieht nach oben ab (nur wenn sie gerade deckt)
  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (phaseRef.current !== "cover") return;
    startReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, []);

  const transform =
    phase === "cover"
      ? "translate3d(0,0,0)"
      : phase === "reveal"
        ? HIDDEN_ABOVE
        : HIDDEN_BELOW;
  // Beim Zurücksetzen nach unten (idle) darf nichts animiert werden
  const transition =
    phase === "cover"
      ? `transform ${COVER_MS}ms ${EASE}`
      : phase === "reveal"
        ? `transform ${REVEAL_MS}ms ${EASE}`
        : "none";

  return (
    <>
      {children}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100]"
        style={{
          transform,
          transition,
          visibility: phase === "idle" ? "hidden" : "visible",
          willChange: phase === "idle" ? undefined : "transform",
        }}
      >
        {/* Wand: tiefes Schwarz mit minimalem Verlauf */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#0b0b0d] to-black" />
        {/* Glasiger Schimmer: schwaches diagonales Licht und weiche Aufhellung oben */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.09)_46%,rgba(255,255,255,0.02)_54%,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.07] to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.12)]" />

        {/* Glas-Lippen: weicher Blur-Saum an Ober- und Unterkante der Wand */}
        <div
          className="absolute inset-x-0 bottom-full h-[120px] bg-gradient-to-t from-black/50 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{ WebkitBackdropFilter: "blur(10px)" }}
        />
        <div
          className="absolute inset-x-0 top-full h-[120px] bg-gradient-to-b from-black/50 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black,transparent)]"
          style={{ WebkitBackdropFilter: "blur(10px)" }}
        />
      </div>
    </>
  );
}
