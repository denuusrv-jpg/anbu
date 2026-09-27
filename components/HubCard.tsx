"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import Translated from "@/components/Translated";

export default function HubCard({
  hub,
  badgeLabel,
  index,
}: {
  hub: string;
  badgeLabel: string;
  index: number;
}) {
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: "easeOut" }}
      className="flex cursor-default flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 will-change-transform hover:border-gold/60 hover:shadow-[0_0_28px_-4px_rgba(242,166,90,0.55)]"
    >
      <span className="text-sm font-medium text-zinc-100">
        <Translated text={hub} />
      </span>
      <span className="mt-auto inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/60 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-rose">
        <span className="h-1.5 w-1.5 rounded-full bg-rose" />
        <Translated text={badgeLabel} />
      </span>
    </motion.div>
  );
}
