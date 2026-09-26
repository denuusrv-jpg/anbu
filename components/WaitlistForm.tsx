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
          className="w-full rounded-full border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-center text-sm text-white placeholder:text-white/70 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
        >
          Auf die Warteliste
        </button>
      </form>
      <p className="mx-auto mt-6 block w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl">
        Kein Spam. Ab 100 Anmeldungen startet deine Region.
      </p>
    </>
  );
}
