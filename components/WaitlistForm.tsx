"use client";

import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function WaitlistForm() {
  const { t } = useLanguage();

  function scrollToErfahreMehr() {
    document
      .getElementById("erfahre-mehr")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
      <button
        type="button"
        className="cta-premium w-full whitespace-nowrap rounded-full border border-zinc-800 bg-zinc-900/70 px-6 py-3 text-sm font-semibold text-white transition [--sheen-alpha:0.18] hover:border-gold"
      >
        <Translated text={t.waitlist.login} />
      </button>
      <button
        type="button"
        onClick={scrollToErfahreMehr}
        className="cta-premium w-full whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
      >
        <Translated text={t.waitlist.register} />
      </button>
    </div>
  );
}
