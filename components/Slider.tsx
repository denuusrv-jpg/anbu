"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

const THICKNESS = 16; // Dicke der drehenden Karten in px

// Handy: horizontaler Slider mit einrastenden Slides, sichtbarer Nachbarkarte, Pfeilen und Punkten.
// Ab der sm-Breite (Tablet/Desktop) lösen sich die Slides auf und liegen im übergebenen Raster.
export default function Slider({
  slides,
  desktopClassName,
  slideClassName = "w-[84%]",
  label,
  flip = false,
}: {
  slides: ReactNode[];
  desktopClassName: string;
  slideClassName?: string;
  label: string;
  /** Handy: die Slides drehen sich beim Wischen kurz wie eine Karte */
  flip?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = slides.length;

  // Drehung beim Wischen: Nur die Karte, die als Nächstes ins Bild kommt, dreht sich einmal ganz um ihre Achse (wie eine Bankkarte)
  // und zeigt danach wieder die Vorderseite. Die Karte, von der man weg wischt, bleibt flach.
  const settled = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyFlip = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const kids = Array.from(track.children) as HTMLElement[];
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    const step = kids.length > 1 ? kids[1].offsetLeft - kids[0].offsetLeft : track.clientWidth;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    kids.forEach((kid, j) => {
      let angle = 0;
      if (mobile && max > 0 && j !== settled.current) {
        const d = Math.abs(Math.min(kid.offsetLeft - pad, max) - x) / step;
        if (d > 0 && d < 1) angle = 360 * ease(1 - d);
      }
      kid.style.transform = angle ? `perspective(1000px) rotateY(${angle.toFixed(1)}deg)` : "";
      // Vorder- und Rückseite per Winkel umschalten (zuverlässiger als backface-visibility auf iOS)
      const front = angle === 0 || Math.cos((angle * Math.PI) / 180) >= 0;
      const f = kid.querySelector<HTMLElement>("[data-face=front]");
      const b = kid.querySelector<HTMLElement>("[data-face=back]");
      if (f) f.style.visibility = front ? "visible" : "hidden";
      if (b) b.style.visibility = front ? "hidden" : "visible";
    });
    // Ruhe nach dem Wischen: erst wenn eine Karte wirklich eingerastet ist, gilt sie als die, von der man wegwischt
    // (hält man den Finger mitten im Wischen still, bleibt alles wie es ist)
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const at = kids.findIndex((kid) => Math.abs(Math.min(kid.offsetLeft - pad, max) - track.scrollLeft) < 2);
      if (at >= 0 && settled.current !== at) {
        settled.current = at;
        applyFlip();
      }
    }, 140);
  }, []);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    if (flip) applyFlip();
    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) return setActive(0);
    if (track.scrollLeft >= max - 4) return setActive(count - 1);
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).offsetLeft - pad - track.scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, [count, flip, applyFlip]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.min(Math.max(index, 0), count - 1);
    const child = track.children[target] as HTMLElement | undefined;
    if (!child) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    track.scrollTo({ left: child.offsetLeft - pad, behavior: "smooth" });
  }

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      {/* Punkte direkt unter der Überschrift des Bereichs, nicht unter den Slides */}
      <div className={`mb-3 items-center justify-center sm:hidden ${count > 1 ? "flex" : "hidden"}`}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1} / ${count}`}
            aria-current={i === active}
            onClick={() => goTo(i)}
            className="flex h-6 items-center px-1"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-gold shadow-[0_0_10px_rgba(242,166,90,0.6)]" : "w-1.5 bg-white/25"
              }`}
            />
          </button>
        ))}
      </div>
      <div
        ref={trackRef}
        onScroll={update}
        className={`no-scrollbar relative -mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 py-4 -my-4 sm:mx-0 sm:my-0 sm:snap-none sm:overflow-visible sm:p-0 ${desktopClassName}`}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`relative shrink-0 snap-start snap-always ${slideClassName} [transform-style:preserve-3d] sm:contents sm:w-auto`}
          >
            <div
              data-face="front"
              className="h-full [&>*]:h-full sm:contents"
              style={flip ? { transform: `translateZ(${THICKNESS / 2}px)` } : undefined}
            >
              {slide}
            </div>
            {flip && (
              <>
                {/* Rückseite */}
                <div
                  data-face="back"
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,#8a1630,#4a0e24_55%,#1a0810)] sm:hidden"
                  style={{ visibility: "hidden", transform: `rotateY(180deg) translateZ(${THICKNESS / 2}px)` }}
                >
                  <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-wordmark-solid-white.png" alt="" className="relative w-3/5 opacity-90" draggable={false} />
                </div>
                {/* Seitenkanten: geben der Karte Dicke, wenn sie sich dreht */}
                {(["left", "right"] as const).map((side) => (
                  <div
                    key={side}
                    aria-hidden
                    className="absolute top-3 bottom-3 bg-gradient-to-b from-[#4b3a2a] via-[#a9783f] to-[#4b3a2a] sm:hidden"
                    style={{
                      width: THICKNESS,
                      [side]: -THICKNESS / 2,
                      transform: `rotateY(${side === "left" ? -90 : 90}deg)`,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
