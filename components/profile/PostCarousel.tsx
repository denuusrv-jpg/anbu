"use client";

import { useRef, useState } from "react";

// Beitrag mit mehreren Bildern: wischen, Pfeile oder Punkte
export default function PostCarousel({ slides, alt }: { slides: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const go = (next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  return (
    <div
      className="relative aspect-square w-full overflow-hidden bg-black"
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slides[index]} alt={`${alt}, Bild ${index + 1} von ${slides.length}`} className="h-full w-full object-cover" draggable={false} />
      {slides.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" onClick={() => go(index - 1)} aria-label="Vorheriges Bild" className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              ‹
            </button>
          )}
          {index < slides.length - 1 && (
            <button type="button" onClick={() => go(index + 1)} aria-label="Nächstes Bild" className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              ›
            </button>
          )}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden>
            {slides.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
