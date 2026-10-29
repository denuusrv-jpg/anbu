"use client";

import { useRef, useState } from "react";
import { CheckIcon } from "@/components/Icons";

type Status = "idle" | "dragging" | "sending";

const THUMB = 48; // Durchmesser des runden Knopfs
const PAD = 4; // gleicher Abstand oben, unten und links

// Zum Senden ziehen. Funktioniert mit Finger und Maus (Pointer-Events), per Tastatur mit Pfeil rechts/Enter.
// Der Knopf ist ein exakter Kreis, mittig in der Spur; ein Tippen ohne Ziehen sendet nicht.
export default function SlideToSend({
  label,
  sendingLabel = "Wird gesendet …",
  onSuccess,
  disabled = false,
  field,
}: {
  label: string;
  sendingLabel?: string;
  onSuccess: () => void;
  disabled?: boolean;
  /** Statt der Beschriftung ein Eingabefeld in der Spur (z. B. E-Mail), der Knopf sendet erst, wenn "disabled" aus ist */
  field?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const maxDrag = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [snapping, setSnapping] = useState(false);

  function measure() {
    const track = trackRef.current;
    return track ? Math.max(track.clientWidth - THUMB - PAD * 2, 0) : 0;
  }

  function finish() {
    setSnapping(true);
    setDragX(maxDrag.current);
    setStatus("sending");
    onSuccess();
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || status === "sending") return;
    maxDrag.current = measure();
    startX.current = e.clientX - dragX;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSnapping(false);
    setStatus("dragging");
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (status !== "dragging") return;
    setDragX(Math.min(Math.max(e.clientX - startX.current, 0), maxDrag.current));
  }

  function onPointerUp() {
    if (status !== "dragging") return;
    if (maxDrag.current > 0 && dragX >= maxDrag.current * 0.9) {
      finish();
    } else {
      setSnapping(true);
      setDragX(0);
      setStatus("idle");
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled || status === "sending") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      maxDrag.current = measure();
      finish();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      maxDrag.current = measure();
      setSnapping(true);
      setDragX((x) => Math.min(x + 24, maxDrag.current));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSnapping(true);
      setDragX((x) => Math.max(x - 24, 0));
    }
  }

  const progress = maxDrag.current > 0 ? dragX / maxDrag.current : 0;
  const transition = snapping ? "transform 0.3s ease, width 0.3s ease" : "none";

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full touch-none overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/15 ring-inset select-none ${
        disabled && !field ? "opacity-60" : ""
      }`}
    >
      {/* Fortschritts-Füllung: gleiche Höhe und Position wie der Knopf, endet unter ihm (kein Rand um den Knopf) */}
      <div
        aria-hidden
        className="absolute top-1 left-1 rounded-full bg-gradient-to-r from-gold/70 to-gold-light"
        style={{ height: THUMB, width: `${dragX + THUMB}px`, transition }}
      />

      {/* Beschriftung */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-3 pl-[64px]">
        {status === "sending" ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
            {sendingLabel}
          </span>
        ) : field ? (
          <div className="pointer-events-auto w-full" style={{ opacity: Math.max(0, 1 - progress * 1.6) }}>
            {field}
          </div>
        ) : (
          <span className="text-sm font-medium whitespace-nowrap text-white" style={{ opacity: Math.max(0, 1 - progress * 1.6) }}>
            {label}
          </span>
        )}
      </div>

      {/* Runder Knopf */}
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="absolute top-1 left-1 flex touch-none items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold text-zinc-950 shadow-[0_3px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.45)] outline-none select-none focus-visible:ring-2 focus-visible:ring-white/80"
        style={{
          width: THUMB,
          height: THUMB,
          transform: `translateX(${dragX}px)`,
          transition,
          cursor: disabled ? "not-allowed" : status === "dragging" ? "grabbing" : "grab",
          opacity: disabled && field ? 0.55 : 1,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {status === "sending" ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <svg viewBox="0 0 24 24" className="pointer-events-none h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </div>
    </div>
  );
}
