"use client";

import Link from "next/link";
import { useTx } from "@/lib/LanguageContext";

const MARK = "\u0001";

// Pflicht-Haken für die Datenschutzbestimmungen (mit Hinweis auf die KI-Analyse)
export default function ConsentCheckbox({
  checked,
  onChange,
  id = "consent",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}) {
  const tx = useTx();
  // Der Link steht mitten im Satz; die Wortstellung hängt von der Sprache ab, daher ein Platzhalter
  const [before, after] = tx(
    "Ich akzeptiere die {link}. (DSpora nutzt intelligente KI-Analysen für dein Matching – E-Mails, Nummern und Links werden zu deinem Schutz vor der Verarbeitung automatisch blockiert).",
    { link: MARK },
  ).split(MARK);
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-left text-[13px] leading-relaxed text-zinc-200">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#f2a65a]"
      />
      <span>
        {before}
        <Link href="/datenschutz" target="_blank" className="font-semibold text-gold underline underline-offset-2">
          {tx("Datenschutzbestimmungen")}
        </Link>
        {after}
      </span>
    </label>
  );
}
