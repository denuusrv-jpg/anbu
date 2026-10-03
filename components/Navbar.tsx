"use client";

import Link from "next/link";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Language, languages } from "@/lib/translations";
import Translated from "@/components/Translated";

const boxClassName =
  "flex items-center justify-center whitespace-nowrap rounded-xl bg-zinc-800/80 px-4 text-xs font-semibold tracking-wide text-zinc-200 uppercase transition-colors hover:text-white";

const LANGUAGE_LABELS: Record<Language, string> = {
  de: "Deutsch",
  ta: "Tamil",
  en: "English",
};

export default function Navbar() {
  const [isDesktop, setIsDesktop] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const { t } = useLanguage();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px) and (pointer: fine)");
    setIsDesktop(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const items = [
    { id: "erfahreMehr", title: t.nav.erfahreMehr, href: "#erfahre-mehr" },
    { id: "mission", title: t.nav.mission, href: "/mission" },
    { id: "kontakt", title: t.nav.kontakt, href: "/kontakt" },
  ];

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="relative z-30 mx-auto flex w-fit flex-wrap items-end justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 shadow-lg shadow-black/30 backdrop-blur-md sm:gap-4 sm:px-4"
    >
      {items.map((item) =>
        isDesktop ? (
          <NavBoxDesktop key={item.id} mouseX={mouseX} {...item} />
        ) : (
          <NavBoxStatic key={item.id} {...item} />
        ),
      )}
      <LanguageSwitcher isDesktop={isDesktop} />
    </motion.div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isAnchor = href.startsWith("#");
  return isAnchor ? (
    <a href={href}>{children}</a>
  ) : (
    <Link href={href}>{children}</Link>
  );
}

function NavBoxStatic({ title, href }: { title: string; href: string }) {
  return (
    <NavLink href={href}>
      <div className={`${boxClassName} h-11 py-2`}>
        <Translated text={title} />
      </div>
    </NavLink>
  );
}

function NavBoxDesktop({
  mouseX,
  title,
  href,
}: {
  mouseX: MotionValue;
  title: string;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const minWidth = Math.max(96, title.length * 8.5 + 32);
  const widthTransform = useTransform(
    distance,
    [-150, 0, 150],
    [minWidth, minWidth + 36, minWidth],
  );
  const heightTransform = useTransform(distance, [-150, 0, 150], [44, 54, 44]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <NavLink href={href}>
      <motion.div ref={ref} style={{ width, height }} className={boxClassName}>
        <Translated text={title} />
      </motion.div>
    </NavLink>
  );
}

function LanguageSwitcher({ isDesktop }: { isDesktop: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherLanguages = languages.filter((lang) => lang !== language);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function handleEnter() {
    if (!isDesktop) return;
    cancelClose();
    setOpen(true);
  }

  function handleLeave() {
    if (!isDesktop) return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }

  useEffect(() => cancelClose, []);

  function handleSelect(lang: Language) {
    cancelClose();
    setLanguage(lang);
    setOpen(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => !isDesktop && setOpen((o) => !o)}
        className={`${boxClassName} h-11 py-2`}
      >
        <Translated text={LANGUAGE_LABELS[language]} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -6, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-1/2 z-20 pt-2"
          >
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-lg shadow-black/40 backdrop-blur-md">
              {otherLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  className="rounded-lg px-5 py-2.5 text-center text-xs font-semibold tracking-wide whitespace-nowrap text-zinc-200 uppercase transition-colors hover:bg-zinc-800 hover:text-gold"
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
