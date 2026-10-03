"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AdminCopilot from "@/components/admin/AdminCopilot";
import KpiBar from "@/components/admin/KpiBar";
import WishesView from "@/components/admin/WishesView";
import AdminTable from "@/components/AdminTable";
import type { AdminData, Kpis } from "@/lib/adminData";

// Hauptansicht des Admin-Bereichs: Kennzahlen, Copilot, Tabellen - oder die Co-Creation-Ansicht.
export default function AdminDashboard({
  data,
  kpis,
  examples,
}: {
  data: AdminData;
  kpis: Kpis;
  examples: string[];
}) {
  const [view, setView] = useState<"overview" | "wishes">("overview");

  return (
    <AnimatePresence mode="wait" initial={false}>
      {view === "wishes" ? (
        <WishesView key="wishes" wishes={data.wishes} onBack={() => setView("overview")} />
      ) : (
        <motion.div
          key="overview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <KpiBar kpis={kpis} />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setView("wishes")}
              className="cta-premium inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-colors [--sheen-alpha:0.14] hover:border-gold/50 hover:text-gold"
            >
              Co-Creation &amp; Wishes
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold">{data.wishes.length}</span>
            </button>
          </div>

          <AdminCopilot examples={examples} />

          <AdminTable
            waitlist={data.waitlist}
            profiles={data.profiles}
            drafts={data.drafts}
            wishes={data.wishes}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
