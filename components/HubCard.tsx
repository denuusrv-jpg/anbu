"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

export default function HubCard({ hub }: { hub: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 250, damping: 20 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig);
  const scale = useSpring(1, springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseEnter() {
    scale.set(1.04);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    scale.set(1);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        transformPerspective: 800,
      }}
      className="flex cursor-default flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl will-change-transform"
    >
      <span className="text-sm font-medium text-zinc-100">{hub}</span>
      <span className="mt-auto inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/60 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-rose">
        <span className="h-1.5 w-1.5 rounded-full bg-rose" />
        Warteliste aktiv
      </span>
    </motion.div>
  );
}
