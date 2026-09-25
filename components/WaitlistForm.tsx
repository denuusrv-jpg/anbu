"use client";

export default function WaitlistForm() {
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
          placeholder="deine@mail.com"
          className="w-full rounded-full border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-sm text-white placeholder:text-white/70 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
        >
          Auf die Warteliste
        </button>
      </form>
      <p className="mt-3 text-xs text-white">
        Kein Spam. Wir melden uns nur, wenn's losgeht.
      </p>
    </>
  );
}
