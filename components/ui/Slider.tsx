"use client";

import { useRef, useState } from "react";
import { useTx } from "@/lib/LanguageContext";

// Slides zum Wischen (Touch) oder per Pfeil: spart Platz, weil nicht alles untereinander steht.
export default function Slider({ slides, label }: { slides: React.ReactNode[]; label: string }) {
  const tx = useTx();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, to));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full shrink-0 snap-center pr-1" aria-label={`${i + 1} / ${count}`}>
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label={tx("Zurück")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-zinc-100 transition-opacity disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm text-zinc-300">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index >= count - 1}
            aria-label={tx("Weiter")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-zinc-100 transition-opacity disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
