"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OPEN_LOGIN_EVENT } from "@/components/LoginGate";
import { useTx } from "@/lib/LanguageContext";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBrowserClient } from "@/lib/supabase/client";

type TabId = "home" | "events" | "ki" | "chats" | "profil";

// Seiten, auf denen die Leiste erscheint (nur Handy). Chat-Räume, Onboarding, Admin und Anmeldung bleiben frei.
function visibleOn(path: string) {
  return (
    ["/", "/mission", "/kontakt", "/events", "/dashboard", "/dashboard/chats", "/dashboard/profil"].includes(path) ||
    path.startsWith("/profil/")
  );
}

function activeTab(path: string): TabId | null {
  if (path === "/") return "home";
  if (path === "/events") return "events";
  if (path === "/dashboard") return "ki";
  if (path === "/dashboard/chats") return "chats";
  if (path === "/dashboard/profil" || path.startsWith("/profil/")) return "profil";
  return null;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeWidth={2.2} />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v3A2.5 2.5 0 0 1 13.5 12H10l-3 2.5V12h-.5A2.5 2.5 0 0 1 4 9.5z" />
      <path d="M16 9h1.5A2.5 2.5 0 0 1 20 11.5v3a2.5 2.5 0 0 1-2.5 2.5H17v2.5L14 17h-3.5a2.5 2.5 0 0 1-2.4-1.8" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M5.8 18.2c1.4-2.2 3.6-3.4 6.2-3.4s4.8 1.2 6.2 3.4" />
    </svg>
  );
}

// Leuchtendes KI-Symbol: drei verschränkte Bahnen im Farbverlauf
function OrbIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden>
      <defs>
        <linearGradient id="orb-g" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff7ab6" />
          <stop offset="0.5" stopColor="#ffb86b" />
          <stop offset="1" stopColor="#7ab8ff" />
        </linearGradient>
      </defs>
      <g stroke="url(#orb-g)" strokeWidth="2.2">
        <ellipse cx="20" cy="20" rx="14" ry="6.5" />
        <ellipse cx="20" cy="20" rx="14" ry="6.5" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="14" ry="6.5" transform="rotate(120 20 20)" />
      </g>
      <circle cx="20" cy="20" r="3.4" fill="url(#orb-g)" />
    </svg>
  );
}

// Untere Navigationsleiste fürs Handy: schwebende Kapsel mit hervorgehobenem KI-Check in der Mitte.
// Nur die Startseite ist ohne Anmeldung offen; alle anderen Punkte öffnen für Gäste das Anmelde-Fenster.
export default function MobileTabBar() {
  const path = usePathname();
  const tx = useTx();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const visible = visibleOn(path);
  const current = activeTab(path);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoggedIn(false);
      return;
    }
    const auth = getBrowserClient().auth;
    let alive = true;
    auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (alive) setLoggedIn(Boolean(data.session));
    });
    const { data } = auth.onAuthStateChange((_event: string, session: unknown) => setLoggedIn(Boolean(session)));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Platz unter dem Inhalt, damit nichts hinter der Leiste verschwindet (siehe globals.css)
  // Startseite: Nach dem Hero-Bereich klappt die Leiste ein und kommt erst am Hero wieder
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (path !== "/") {
      setPastHero(false);
      return;
    }
    // Beim ersten Scrollen nach unten klappt die Leiste ein; zurück kommt sie, sobald man nach oben scrollt und der Hero wieder zu sehen ist
    let lastY = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      const hero = document.querySelector(".hero-bg");
      const heroVisible = hero ? hero.getBoundingClientRect().bottom > window.innerHeight * 0.5 : true;
      if (y <= 8) setPastHero(false);
      else if (y > lastY) setPastHero(true);
      else if (y < lastY && heroVisible) setPastHero(false);
      lastY = y;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [path]);

  useEffect(() => {
    // Auf der Startseite liegt die Leiste nur über dem Hero: dort braucht der Inhalt keinen Platz darunter
    document.documentElement.classList.toggle("has-tabbar", visible && path !== "/");
    return () => document.documentElement.classList.remove("has-tabbar");
  }, [visible, path]);

  if (!visible) return null;

  const tabs: { id: TabId; href: string; label: string; gated: boolean }[] = [
    { id: "home", href: "/", label: "Home", gated: false },
    { id: "events", href: "/events", label: tx("Events"), gated: true },
    { id: "ki", href: "/dashboard", label: tx("KI-Check"), gated: true },
    { id: "chats", href: "/dashboard/chats", label: tx("Chats"), gated: true },
    { id: "profil", href: "/dashboard/profil", label: tx("Profil"), gated: true },
  ];

  // Gäste: kein Seitenwechsel, sondern das Anmelde-Fenster (PageTransition lässt solche Links in Ruhe)
  const locked = (tab: { gated: boolean }) => (tab.gated && loggedIn === false ? { "data-no-transition": "" } : {});

  function onTab(e: React.MouseEvent, tab: { href: string; gated: boolean }) {
    if (tab.gated && loggedIn === false) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent(OPEN_LOGIN_EVENT, { detail: { next: tab.href } }));
    }
  }

  const side = (id: TabId) =>
    `flex h-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-200 active:scale-95 ${
      current === id ? "font-semibold text-zinc-900" : "text-zinc-500"
    }`;

  return (
    <nav
      aria-label="Hauptnavigation"
      aria-hidden={pastHero}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] transition-[transform,opacity] duration-300 ease-out sm:hidden ${
        pastHero ? "translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className={`relative mx-auto grid h-[66px] max-w-md grid-cols-[1fr_1fr_88px_1fr_1fr] rounded-2xl border border-white/70 bg-white/95 px-1.5 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.55)] backdrop-blur-2xl ${pastHero ? "pointer-events-none" : "pointer-events-auto"}`}>
        {tabs.map((tab) => {
          if (tab.id === "ki") {
            return (
              <div key={tab.id} className="relative">
                <Link
                  href={tab.href}
                  onClick={(e) => onTab(e, tab)}
                  {...locked(tab)}
                  aria-current={current === "ki" ? "page" : undefined}
                  className={`absolute left-1/2 -top-5 flex h-[86px] w-[86px] -translate-x-1/2 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#b3224a,#6b1233_60%,#3d0a1f)] text-white transition-transform duration-200 active:scale-95 ${
                    current === "ki"
                      ? "shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_10px_30px_-4px_rgba(138,22,48,0.85)]"
                      : "shadow-[0_10px_28px_-4px_rgba(138,22,48,0.75)]"
                  }`}
                >
                  <OrbIcon />
                  <span className="-mt-0.5 text-[11px] font-semibold">{tab.label}</span>
                </Link>
              </div>
            );
          }
          const Icon = { home: HomeIcon, events: CalendarIcon, chats: ChatsIcon, profil: ProfileIcon }[tab.id];
          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={(e) => onTab(e, tab)}
              {...locked(tab)}
              aria-current={current === tab.id ? "page" : undefined}
              className={side(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
