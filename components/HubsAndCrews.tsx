"use client";

import { motion } from "motion/react";
import HubCard from "@/components/HubCard";
import GroupSizeCard from "@/components/GroupSizeCard";
import ShareLinkBadge from "@/components/ShareLinkBadge";
import WaitlistCapture from "@/components/WaitlistCapture";
import Translated from "@/components/Translated";
import { useLanguage } from "@/lib/LanguageContext";

const groupImages = [
  { image: "/duo.jpg", width: 500, height: 565 },
  { image: "/crew.jpg", width: 500, height: 565 },
  { image: "/squad.jpg", width: 500, height: 565 },
];

export default function HubsAndCrews() {
  const { t } = useLanguage();

  return (
    <section
      id="erfahre-mehr"
      className="relative overflow-hidden bg-zinc-950 px-6 pt-20 pb-8 sm:px-8 sm:pt-28 sm:pb-10"
    >
      {/* Sanfter Übergang vom Hero-Farbverlauf */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(242,166,90,0.08),transparent)]" />

      <div className="mx-auto max-w-5xl">
        {/* Teil 1: Hubs */}
        <div className="text-center">
          <ShareLinkBadge />
          <h2 className="mt-5 text-2xl font-semibold text-zinc-50 sm:text-3xl">
            <Translated text={t.hubs.heading} />
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.hubs.list.map((hub, index) => (
            <HubCard
              key={index}
              hub={hub}
              badgeLabel={t.hubs.badgeActive}
              index={index}
            />
          ))}
        </div>

        <motion.div
          className="mt-8 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-center backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            <Translated text={t.hubs.infoText} />
          </p>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <WaitlistCapture />
        </motion.div>

        {/* Teil 2: Gruppengrößen */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            <Translated text={t.groups.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            <Translated text={t.groups.subheading} />
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {t.groups.items.map((item, index) => (
            <GroupSizeCard
              key={item.title}
              index={index}
              group={{ ...item, ...groupImages[index] }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
