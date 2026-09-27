"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

const glowColors = {
  teal: "#4FD1C5",
  gold: "#F2A65A",
  rose: "#E85D75",
} as const;

export default function MissionCard({
  color,
  highlight = false,
  children,
}: {
  color: keyof typeof glowColors;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${
        highlight ? "border-gold/20" : "border-white/10"
      } bg-white/5 p-8 backdrop-blur-xl sm:p-10`}
    >
      {/* Wandernder Licht-Impuls: leuchtet nur auf, während die Karte im Blickfeld ist */}
      <motion.div
        className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: glowColors[color] }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: highlight ? 0.35 : 0.22 }}
        viewport={{ once: false, amount: 0.55 }}
        transition={{
          duration: 2.2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
