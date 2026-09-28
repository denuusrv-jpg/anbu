"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon } from "@/components/Icons";

type Status = "idle" | "dragging" | "sending";

const THUMB_SIZE = 48;
const TRACK_PADDING = 4;

export default function SlideToSend({
  label,
  sendingLabel = "Wird gesendet …",
  onSuccess,
  disabled = false,
}: {
  label: string;
  sendingLabel?: string;
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragXRef = useRef(0);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);
  const draggingRef = useRef(false);

  const [dragX, setDragX] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [snapping, setSnapping] = useState(false);

  function updateDragX(value: number) {
    dragXRef.current = value;
    setDragX(value);
  }

  function getMaxDrag() {
    const track = trackRef.current;
    if (!track) return 0;
    return Math.max(track.offsetWidth - THUMB_SIZE - TRACK_PADDING * 2, 0);
  }

  function start(clientX: number) {
    if (disabled || status === "sending") return;
    maxDragRef.current = getMaxDrag();
    startXRef.current = clientX - dragXRef.current;
    draggingRef.current = true;
    setSnapping(false);
    setStatus("dragging");
  }

  function move(clientX: number) {
    if (!draggingRef.current) return;
    const raw = clientX - startXRef.current;
    const clamped = Math.min(Math.max(raw, 0), maxDragRef.current);
    updateDragX(clamped);
  }

  function end() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setSnapping(true);

    const threshold = maxDragRef.current * 0.9;
    if (maxDragRef.current > 0 && dragXRef.current >= threshold) {
      updateDragX(maxDragRef.current);
      setStatus("sending");
      onSuccess();
    } else {
      updateDragX(0);
      setStatus("idle");
    }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      move(e.clientX);
    }
    function onMouseUp() {
      end();
    }
    function onTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) move(touch.clientX);
    }
    function onTouchEnd() {
      end();
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled || status === "sending") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      maxDragRef.current = getMaxDrag();
      updateDragX(maxDragRef.current);
      setStatus("sending");
      onSuccess();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      maxDragRef.current = getMaxDrag();
      updateDragX(Math.min(dragXRef.current + 24, maxDragRef.current));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateDragX(Math.max(dragXRef.current - 24, 0));
    }
  }

  const progress = maxDragRef.current > 0 ? dragX / maxDragRef.current : 0;
  const transitionStyle = snapping ? "all 0.3s ease" : "none";

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-xl select-none ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {/* Fortschritts-Füllung */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold to-gold-light"
        style={{
          width: `${dragX + THUMB_SIZE + TRACK_PADDING}px`,
          transition: transitionStyle,
        }}
      />

      {/* Beschriftung */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
        <span
          className="text-sm font-medium whitespace-nowrap text-white/80"
          style={{ opacity: status === "sending" ? 0 : 1 - progress * 1.3 }}
        >
          {label}
          {status === "idle" ? " →" : ""}
        </span>
        {status === "sending" && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-950">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
            {sendingLabel}
          </span>
        )}
      </div>

      {/* Schieberegler */}
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-disabled={disabled}
        onMouseDown={(e) => start(e.clientX)}
        onTouchStart={(e) => start(e.touches[0].clientX)}
        onKeyDown={handleKeyDown}
        className="absolute top-[2px] left-[2px] flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-gold text-zinc-950 shadow-[0_2px_10px_rgba(0,0,0,0.35)] outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: transitionStyle,
        }}
      >
        {status === "sending" ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <ArrowRightIcon className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}
