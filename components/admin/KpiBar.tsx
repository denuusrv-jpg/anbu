"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import type { Kpis } from "@/lib/adminData";

function Counter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("de-DE"));
  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
}

// Kennzahlen auf einen Blick (Apple-Stil: große Zahl, kleine Beschriftung)
export default function KpiBar({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: "Aktive User", value: kpis.activeUsers, hint: `${kpis.loginsToday} heute eingeloggt · ${kpis.businessUsers} Business`, glow: "bg-gold/25" },
    { label: "Registrierungen heute", value: kpis.registrationsToday, hint: `${kpis.waitlist} auf der Warteliste`, glow: "bg-teal/25" },
    { label: "Im Soft-Delete", value: kpis.softDeleted, hint: "30 Tage Aufbewahrung", glow: "bg-rose/25" },
    { label: "Wünsche & Ideen", value: kpis.wishes, hint: "Co-Creation", glow: "bg-gold/25" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl ${item.glow}`} />
          <p className="relative text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">{item.label}</p>
          <p className="relative mt-2 text-3xl font-bold tracking-tight text-zinc-50">
            <Counter value={item.value} />
          </p>
          <p className="relative mt-1 text-xs text-zinc-500">{item.hint}</p>
        </motion.div>
      ))}
    </div>
  );
}
