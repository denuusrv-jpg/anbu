"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckIcon } from "@/components/Icons";

export type ReadyKind =
  | "guest" // Link per E-Mail verschickt, noch nicht angemeldet
  | "member" // angemeldet, Profil ist angelegt
  | "resume"; // Gespräch fortgesetzt und gespeichert

const EASE = [0.16, 1, 0.3, 1] as const;

// "Du bist startklar": Fenster, das stehen bleibt (kein automatisches Weiterleiten).
// Auch in der Admin-Vorschau verwendet.
export default function ReadyWindow({
  kind,
  email,
  onResend,
  showResend = false,
  inline = false,
}: {
  kind: ReadyKind;
  email?: string;
  onResend?: () => void;
  /** Nur für die Admin-Vorschau: Hinweis zum erneuten Senden anzeigen, ohne Aktion */
  showResend?: boolean;
  /** true: ohne Vollbild-Hintergrund anzeigen (Admin-Vorschau) */
  inline?: boolean;
}) {
  const text =
    kind === "guest"
      ? `Wir haben dir einen Link an ${email ?? "deine E-Mail-Adresse"} geschickt. Mit einem Klick darauf wirst du angemeldet und dein Profil wird gespeichert.`
      : kind === "resume"
        ? "Danke, dass du dich weiter geöffnet hast. Deine Antworten sind gespeichert und helfen uns, dich besser kennenzulernen."
        : "Dein Profil ist angelegt. Sobald sich in deinen Hubs genug Leute eintragen, öffnet sich dein Hub und wir melden uns bei dir.";

  const primary =
    "cta-premium inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold px-8 py-3 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_-12px_rgba(242,166,90,0.45)]";
  const secondary =
    "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold";

  const card = (
    <motion.div
      role="dialog"
      aria-modal={!inline}
      aria-labelledby="ready-title"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-10"
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-[0_0_30px_-8px_rgba(242,166,90,0.6)]">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h2 id="ready-title" className="mt-6 text-3xl font-bold text-zinc-50 uppercase">
          Du bist startklar!
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">{text}</p>

        <div className="mt-8 flex flex-col gap-3">
          {kind === "guest" ? (
            <Link href="/login" className={primary}>
              Anmelden
            </Link>
          ) : (
            <Link href="/dashboard" className={primary}>
              Zum Dashboard
            </Link>
          )}
          <Link href="/" className={secondary}>
            Webseite besuchen
          </Link>
        </div>

        {kind === "guest" && (onResend || showResend) && (
          <button
            type="button"
            onClick={onResend}
            className="mt-5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Link nicht angekommen? Erneut senden oder andere Adresse
          </button>
        )}
      </div>
    </motion.div>
  );

  if (inline) return <div className="flex justify-center">{card}</div>;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/70 px-5 py-6 backdrop-blur-md">
      {card}
    </div>
  );
}
