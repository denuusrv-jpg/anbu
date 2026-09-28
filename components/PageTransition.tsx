"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "covering" | "revealing";

const DURATION_MS = 450;

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [content, setContent] = useState(children);
  const [phase, setPhase] = useState<Phase>("idle");
  const prevPathname = useRef(pathname);
  const pendingContent = useRef(children);

  pendingContent.current = children;

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    setPhase("covering");

    const coverTimer = setTimeout(() => {
      setContent(pendingContent.current);
      setPhase("revealing");
    }, DURATION_MS);

    return () => clearTimeout(coverTimer);
  }, [pathname]);

  useEffect(() => {
    if (phase !== "revealing") return;
    const revealTimer = setTimeout(() => setPhase("idle"), DURATION_MS);
    return () => clearTimeout(revealTimer);
  }, [phase]);

  const scaleX = phase === "covering" ? 1 : 0;
  const origin = phase === "revealing" ? "right" : "left";

  return (
    <>
      {content}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] bg-zinc-950 transition-transform duration-[450ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          transform: `scaleX(${scaleX})`,
          transformOrigin: origin,
        }}
      >
        {/* Leuchtende Kante, die mit der wandernden Wisch-Grenze mitläuft */}
        <div
          className={`absolute top-0 h-full w-[3px] bg-gold shadow-[0_0_24px_4px_rgba(242,166,90,0.65)] ${
            phase === "revealing" ? "left-0" : "right-0"
          }`}
        />
      </div>
    </>
  );
}
