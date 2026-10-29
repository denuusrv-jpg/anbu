"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import Navbar from "@/components/Navbar";
import WaitlistForm from "@/components/WaitlistForm";
import Slider from "@/components/Slider";
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

export default function HomeClient() {
  const { t, language } = useLanguage();
  const isTamil = language === "ta";
  const heroRef = useRef<HTMLDivElement>(null);
  const [edgeHero, setEdgeHero] = useState(true);
  // Handy und Touch: fester Farbverlauf statt der bewegten Welle (keine Pulse, keine wechselnden Farben)
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px), (pointer: coarse)");
    const set = () => setMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Handy: Solange der Hero-Bereich den Bildschirm füllt, sind auch Statusleiste, Browser-Leisten und der Bereich
  // dahinter in seiner Farbe (statt schwarz). Erst wenn man nach unten scrollt, wird alles dunkel.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const previousMeta = meta?.getAttribute("content") ?? null;
    const html = document.documentElement;
    const previousBody = document.body.style.background;
    const previousHtml = html.style.background;
    // Safari färbt Statusleiste und untere Leiste nach der Hintergrundfarbe der Seite (nur eine echte Farbe, kein Verlauf):
    // body durchsichtig, html in der Hero-Farbe, solange der Hero im Bild ist, danach dunkel.
    document.body.style.background = "transparent";
    const update = () => {
      const hero = heroRef.current;
      const inHero = hero ? window.scrollY < hero.offsetHeight * 0.6 : true;
      // Handy: der Verlauf geht von Rot bis Orange; am Desktop bleibt es bei der Welle
      html.style.background = inHero ? (mobile ? "#8a1630" : "#a21c4f") : "#09090b";
      setEdgeHero(inHero);
      meta?.setAttribute("content", inHero ? (mobile ? "#8a1630" : "#86195a") : "#09090b");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      document.body.style.background = previousBody;
      html.style.background = previousHtml;
      if (meta && previousMeta !== null) meta.setAttribute("content", previousMeta);
    };
  }, [mobile]);

  return (
    <main className="min-h-[100dvh] bg-zinc-950">
      {/* iPhone-Safari färbt die obere und untere Leiste nach festen Elementen am Bildschirmrand (Verläufe erkennt er nicht):
          oben die Farbe, mit der der Verlauf beginnt, unten die, mit der er endet. Unsichtbar hinter dem Hero. */}
      {mobile && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[max(env(safe-area-inset-top),24px)]"
            style={{ background: edgeHero ? "#8a1630" : "#09090b" }}
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[max(env(safe-area-inset-bottom),24px)]"
            style={{ background: edgeHero ? "#f2701a" : "#09090b" }}
          />
        </>
      )}
      <div
        ref={heroRef}
        className="hero-bg relative isolate flex min-h-[100lvh] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        {!mobile && <FlowingWaveBackground />}

        {/* Hero — takes the full first screen */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 sm:px-8">
          <section
            className={`relative mx-auto flex w-full flex-1 flex-col justify-center py-16 text-center touch:justify-start touch:pt-36 touch:pb-10 ${isTamil ? "max-w-4xl" : "max-w-3xl"}`}
          >
            {/* Logo und Navigation. Handy: Kopfleiste mit Sprache, Logo und Menü (Logo hier ausgeblendet) */}
            <div className="mb-12 flex flex-col touch:mb-0">
              <div className="mb-6 flex justify-center touch:hidden">
                <Image
                  src="/logo-orange.png"
                  alt="DSpora Community"
                  width={1548}
                  height={454}
                  priority
                  className="h-12 w-auto sm:h-16"
                />
              </div>
              <Navbar />
            </div>

            <h1 className="text-[clamp(1.25rem,calc(7.76vw_-_5px),3rem)] leading-tight font-bold tracking-tight text-black uppercase touch:-mx-3 touch:text-[clamp(2.2rem,13.7vw,4.5rem)] touch:leading-[1.02] touch:font-black touch:text-[#fff3e8] touch:[text-shadow:0_2px_30px_rgba(255,190,140,0.35)]">
              <Translated text={t.hero.heading[0]} />
              {/* Am Handy nur die erste Zeile */}
              <span className="touch:hidden">
                <br />
                <Translated text={t.hero.heading[1]} />
              </span>
            </h1>

            <p
              className={`mx-auto mt-5 text-base leading-relaxed text-white touch:mt-6 touch:text-[1rem] touch:leading-snug touch:hyphens-auto touch:text-justify touch:text-orange-50/90 touch:[text-shadow:0_1px_10px_rgba(60,10,10,0.35)] sm:text-lg ${isTamil ? "max-w-3xl" : "max-w-lg"}`}
            >
              <Translated text={t.hero.description} />
            </p>

            <div className="touch:mt-32">
            <WaitlistForm />
            </div>
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

          <Slider
            label={t.ai.heading}
            desktopClassName="sm:grid sm:grid-cols-3 sm:gap-8"
            slides={t.features.items.map((feature, index) => {
              const { Icon, wrap } = featureStyles[index];
              return (
                <motion.div
                  key={feature.title}
                  className="feature-tile cursor-default text-center rounded-3xl border border-white/10 bg-white/5 px-6 py-9 backdrop-blur-xl sm:rounded-none sm:border-transparent sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className={`badge-flash mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${wrap}`}
                  >
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-50">
                    <Translated text={feature.title} />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    <Translated text={feature.description} />
                  </p>
                </motion.div>
              );
            })}
          />

          <SignUpCta />
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-10 text-center sm:px-8">
        <p className="text-sm text-zinc-400">
          <Translated text={t.footer.tagline} />
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-400">
          <Link href="/impressum" className="hover:text-white">
            <Translated text={t.footer.impressum} />
          </Link>
          <span>&middot;</span>
          <Link href="/datenschutz" className="hover:text-white">
            <Translated text={t.footer.datenschutz} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
