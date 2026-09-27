"use client";

import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function WaitlistForm() {
  const { t } = useLanguage();

  return (
    <>
      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="w-full whitespace-nowrap rounded-full border border-zinc-800 bg-zinc-900/70 px-6 py-3 text-sm font-semibold text-white transition hover:border-gold"
        >
          <Translated text={t.waitlist.login} />
        </button>
        <button
          type="button"
          className="w-full whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
        >
          <Translated text={t.waitlist.register} />
        </button>
      </div>
      <p className="mx-auto mt-6 block w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl">
        <Translated text={t.waitlist.note} />
      </p>
    </>
  );
}
