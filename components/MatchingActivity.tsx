"use client";

import { motion, useReducedMotion } from "motion/react";

// Ruhige Endlos-Animation für "es wird gearbeitet": ein Kern, Wellen, die nach außen laufen, und drei Punkte, die kreisen.
// Alles läuft gleichmäßig in Schleife, es gibt keinen Anfang und kein Ende, die Animation sagt also nichts darüber, wie weit etwas ist.
export default function MatchingActivity({ label }: { label: string }) {
  const still = useReducedMotion();
  const orbit = [
    { radius: 22, duration: 9, size: 6, start: 0 },
    { radius: 30, duration: 13, size: 5, start: 120 },
    { radius: 38, duration: 17, size: 4, start: 240 },
  ];
  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3" role="status">
      <div className="relative h-[88px] w-[88px] shrink-0" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 m-auto rounded-full border border-gold/50"
            style={{ width: 28, height: 28 }}
            animate={still ? undefined : { scale: [1, 3], opacity: [0.55, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: i * 1.6 }}
          />
        ))}
        <span className="absolute inset-0 m-auto h-3.5 w-3.5 rounded-full bg-gold shadow-[0_0_18px_rgba(242,166,90,0.8)]" />
        {orbit.map((o, i) => (
          <motion.span
            key={i}
            className="absolute inset-0"
            initial={{ rotate: o.start }}
            animate={still ? undefined : { rotate: o.start + 360 }}
            transition={{ duration: o.duration, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute left-1/2 rounded-full bg-gold-light/90"
              style={{ width: o.size, height: o.size, top: `calc(50% - ${o.radius}px)`, marginLeft: -o.size / 2 }}
            />
          </motion.span>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">{label}</p>
    </div>
  );
}
