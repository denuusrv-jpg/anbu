"use client";

import { motion } from "motion/react";
import HubCard from "@/components/HubCard";
import GroupSizeCard from "@/components/GroupSizeCard";
import Slider from "@/components/Slider";
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
  const { t, language } = useLanguage();

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

        <div className="mt-4 sm:mt-10">
          <Slider
            label={t.hubs.heading}
            desktopClassName="sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
            slides={Array.from({ length: Math.ceil(t.hubs.list.length / 2) }, (_, slide) => (
              <div key={slide} className="flex flex-col gap-3 sm:contents">
                {t.hubs.list.slice(slide * 2, slide * 2 + 2).map((hub, i) => (
                  <HubCard
                    key={slide * 2 + i}
                    hub={hub}
                    badgeLabel={t.hubs.badgeActive}
                    index={slide * 2 + i}
                  />
                ))}
              </div>
            ))}
          />
        </div>

        <motion.div
          className="glass-soft mt-8 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-center backdrop-blur-xl [container-type:inline-size] transition-[border-color,box-shadow,background-color] duration-500 hover:border-gold/35 hover:bg-white/[0.07] hover:shadow-[0_0_32px_-10px_rgba(242,166,90,0.4)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className={`mx-auto max-w-5xl text-justify text-[5.05cqw] leading-relaxed sm:text-base text-zinc-300 [hyphens:auto] ${language === "ta" ? "[text-align-last:start]" : "[text-align-last:justify]"} sm:text-balance sm:text-center sm:[hyphens:manual] sm:[text-align-last:auto]`}>
            {/* Handy: Schriftgröße folgt der Boxbreite, damit der Blocksatz auf jedem iPhone gleich umbricht */}
            <span className="sm:hidden">
              <Translated text={t.hubs.infoTextMobile ?? t.hubs.infoText} />
            </span>
            <span className="hidden sm:inline">
              <Translated text={t.hubs.infoText} />
            </span>
          </p>
          <div className="mt-6">
            <WaitlistCapture />
          </div>
        </motion.div>

        {/* Teil 2: Gruppengrößen */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            <Translated text={t.groups.heading} />
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            <Translated text={t.groups.subheading} />
          </p>
        </div>

        <div className="mt-4 sm:mt-10">
          <Slider
            label={t.groups.heading}
            flip
            desktopClassName="sm:grid sm:grid-cols-3 sm:gap-6"
            slideClassName="w-[78%]"
            slides={t.groups.items.map((item, index) => (
              <GroupSizeCard
                key={item.title}
                index={index}
                group={{ ...item, ...groupImages[index] }}
              />
            ))}
          />
        </div>
      </div>
    </section>
  );
}
