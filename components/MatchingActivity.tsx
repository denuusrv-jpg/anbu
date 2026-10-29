"use client";

import { useReducedMotion } from "motion/react";

// Ruhige Endlos-Animation für "es wird gearbeitet": ein Lichtstreifen läuft gleichmäßig um den Rand des Kastens.
// Er läuft immer weiter im Kreis, es gibt keinen Anfang und kein Ende, die Animation sagt also nichts darüber, wie weit etwas ist.
export default function MatchingActivity({ label }: { label: string }) {
  const still = useReducedMotion();
  return (
    <div className="relative mt-5 rounded-2xl bg-white/[0.04] px-4 py-4" role="status">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
        {/* feine feste Linie */}
        <rect width="100%" height="100%" rx="16" ry="16" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        {!still && (
          <>
            {/* Leuchten um den Streifen */}
            <rect
              width="100%"
              height="100%"
              rx="16"
              ry="16"
              pathLength="100"
              className="dash-run"
              stroke="rgba(242,166,90,0.55)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: "blur(4px)" }}
            />
            {/* heller Streifen */}
            <rect
              width="100%"
              height="100%"
              rx="16"
              ry="16"
              pathLength="100"
              className="dash-run"
              stroke="#ffd9a8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <p className="relative text-sm leading-relaxed text-zinc-200">{label}</p>
    </div>
  );
}
