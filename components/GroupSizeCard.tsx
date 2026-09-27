"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

type GroupSize = {
  title: string;
  image: string;
  width: number;
  height: number;
  size: string;
  description: string;
};

export default function GroupSizeCard({ group }: { group: GroupSize }) {
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
    scale.set(1.03);
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
      className="cursor-default overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-center backdrop-blur-xl transition-[border-color,box-shadow] duration-300 will-change-transform hover:border-gold/60 hover:shadow-[0_0_28px_-4px_rgba(242,166,90,0.55)]"
    >
      <Image
        src={group.image}
        alt={group.title}
        width={group.width}
        height={group.height}
        className="w-full h-auto"
      />
      <span className="relative mt-4 inline-flex w-fit items-center rounded-lg border border-gold/20 bg-zinc-950/80 px-3 py-1 text-[11px] font-medium tracking-wide text-gold shadow-[0_0_16px_-4px_rgba(242,166,90,0.6)]">
        {group.size}
      </span>
      <p className="px-6 pt-4 pb-6 text-sm leading-relaxed text-zinc-400">
        {group.description}
      </p>
    </motion.div>
  );
}
