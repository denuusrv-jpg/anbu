"use client";

import { motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import Navbar from "@/components/Navbar";
import WaitlistForm from "@/components/WaitlistForm";
import HubsAndCrews from "@/components/HubsAndCrews";
import AiMatchingCard from "@/components/AiMatchingCard";
import SignUpCta from "@/components/SignUpCta";
import Translated from "@/components/Translated";
import { useLanguage } from "@/lib/LanguageContext";
import { ChatIcon, ShieldIcon, UsersIcon } from "@/components/Icons";
import Image from "next/image";
import Link from "next/link";

const featureStyles = [
  { Icon: UsersIcon, wrap: "bg-teal/10 text-teal" },
  { Icon: ShieldIcon, wrap: "bg-gold/10 text-gold" },
  { Icon: ChatIcon, wrap: "bg-rose/10 text-rose" },
];

export default function Home() {
  const { t, language } = useLanguage();
  const isTamil = language === "ta";

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <FlowingWaveBackground />

        {/* Hero — takes the full first screen */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 sm:px-8">
          <section
            className={`relative mx-auto flex w-full flex-1 flex-col justify-center py-16 text-center ${isTamil ? "max-w-4xl" : "max-w-3xl"}`}
          >
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo-orange.png"
                alt="DSpora Community"
                width={1548}
                height={454}
                priority
                className="h-12 w-auto sm:h-16"
              />
            </div>

            <div className="mb-12">
              <Navbar />
            </div>

            <h1 className="text-[clamp(1.25rem,calc(7.76vw_-_5px),3rem)] leading-tight font-bold tracking-tight text-black uppercase">
              <Translated text={t.hero.heading[0]} />
              <br />
              <Translated text={t.hero.heading[1]} />
            </h1>

            <p
              className={`mx-auto mt-5 text-base leading-relaxed text-white sm:text-lg ${isTamil ? "max-w-3xl" : "max-w-lg"}`}
            >
              <Translated text={t.hero.description} />
            </p>

            <WaitlistForm />
          </section>
        </div>
      </div>

      <HubsAndCrews />

      {/* Funktionen */}
      <section
        id="funktionen"
        className="px-6 pt-8 pb-20 sm:px-8 sm:pt-10 sm:pb-28"
      >
        <div className="mx-auto max-w-5xl">
          <AiMatchingCard />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {t.features.items.map((feature, index) => {
              const { Icon, wrap } = featureStyles[index];
              return (
                <motion.div
                  key={feature.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${wrap}`}
                  >
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-50">
                    <Translated text={feature.title} />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    <Translated text={feature.description} />
                  </p>
                </motion.div>
              );
            })}
          </div>

          <SignUpCta />
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-10 text-center sm:px-8">
        <p className="text-sm text-zinc-600">
          <Translated text={t.footer.tagline} />
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-600">
          <Link href="/impressum" className="hover:text-zinc-400">
            <Translated text={t.footer.impressum} />
          </Link>
          <span>&middot;</span>
          <Link href="/datenschutz" className="hover:text-zinc-400">
            <Translated text={t.footer.datenschutz} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
