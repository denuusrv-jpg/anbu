"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

// Handy: horizontaler Slider mit einrastenden Slides, sichtbarer Nachbarkarte, Pfeilen und Punkten.
// Ab der sm-Breite (Tablet/Desktop) lösen sich die Slides auf und liegen im übergebenen Raster.
export default function Slider({
  slides,
  desktopClassName,
  slideClassName = "w-[84%]",
  label,
}: {
  slides: ReactNode[];
  desktopClassName: string;
  slideClassName?: string;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = slides.length;

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
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
  }, [count]);

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

  const arrow =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-200 backdrop-blur-xl transition-[opacity,border-color,color] duration-200 active:scale-95 disabled:opacity-30";

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={trackRef}
        onScroll={update}
        className={`no-scrollbar relative -mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-3 overflow-x-auto px-6 py-4 -my-4 sm:mx-0 sm:my-0 sm:snap-none sm:overflow-visible sm:p-0 ${desktopClassName}`}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`shrink-0 snap-start ${slideClassName} [&>*]:h-full sm:contents sm:w-auto`}
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
        <button
          type="button"
          aria-label="Zurück"
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
          className={arrow}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-6 bg-gold shadow-[0_0_10px_rgba(242,166,90,0.6)]"
                  : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Weiter"
          disabled={active === count - 1}
          onClick={() => goTo(active + 1)}
          className={arrow}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
