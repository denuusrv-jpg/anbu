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
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTx } from "@/lib/LanguageContext";
import { useScrollLock } from "@/lib/useScrollLock";
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

  // Handy und Touch: nur ein "Menü"-Knopf, die Seiten öffnen sich in einem schwarzen Vollbild-Menü
  if (!isDesktop) return <MobileMenu items={items} />;

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

const NATIVE_LANGUAGE_LABELS: Record<Language, string> = { de: "Deutsch", ta: "தமிழ்", en: "English" };

function MobileMenu({ items }: { items: { id: string; title: string; href: string }[] }) {
  const tx = useTx();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useScrollLock(open);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Anker (z. B. "Erfahre mehr"): erst schließen, dann dorthin scrollen
  function choose(e: React.MouseEvent, href: string) {
    setOpen(false);
    if (href.startsWith("#")) {
      e.preventDefault();
      window.setTimeout(() => document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" }), 350);
    }
  }

  const pill =
    "inline-flex items-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-gold/60";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={`${pill} relative z-30 mx-auto shadow-lg shadow-black/30`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
        {tx("Menü")}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={tx("Menü")}
                className="fixed inset-0 z-[150] flex flex-col bg-black px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between">
                  <Image src="/logo-orange.png" alt="DSpora" width={1548} height={454} className="h-9 w-auto" />
                  <button type="button" onClick={() => setOpen(false)} className={pill} aria-label={tx("Schließen")}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                    {tx("Schließen")}
                  </button>
                </div>

                <nav className="flex flex-1 flex-col items-center justify-center gap-7" aria-label={tx("Menü")}>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.08 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <NavLink href={item.href}>
                        <span
                          onClick={(e) => choose(e, item.href)}
                          className="block py-1 text-center text-[clamp(1.9rem,9vw,2.9rem)] leading-tight font-semibold text-white transition-colors hover:text-gold"
                        >
                          <Translated text={item.title} />
                        </span>
                      </NavLink>
                    </motion.div>
                  ))}
                </nav>

                <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Language / Sprache / மொழி">
                  {languages.map((lang) => {
                    const on = lang === language;
                    return (
                      <button
                        key={lang}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        lang={lang}
                        onClick={() => setLanguage(lang)}
                        className={`rounded-full border px-5 py-2.5 text-base font-medium transition-colors ${
                          on ? "border-gold/70 bg-gold/15 text-gold" : "border-white/15 text-zinc-200 hover:border-gold/50"
                        }`}
                      >
                        {NATIVE_LANGUAGE_LABELS[lang]}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
