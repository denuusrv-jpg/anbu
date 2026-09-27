"use client";

import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function WaitlistForm() {
  const { t, language } = useLanguage();

  return (
    <>
      <form
        id="warteliste"
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 scroll-mt-24 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          required
          placeholder={t.waitlist.placeholder}
          key={language}
          className="w-full rounded-full border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-center text-sm text-white placeholder:text-white/70 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
        >
          <Translated text={t.waitlist.button} />
        </button>
      </form>
      <p className="mx-auto mt-6 block w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl">
        <Translated text={t.waitlist.note} />
      </p>
    </>
  );
}
