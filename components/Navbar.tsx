export default function Navbar() {
  return (
    <header className="sticky top-4 z-50 mx-auto flex max-w-2xl items-center justify-between rounded-full border border-zinc-800 bg-zinc-900/70 px-5 py-3 shadow-lg shadow-black/30 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-zinc-950">
          D
        </span>
        <span className="text-base font-semibold tracking-tight text-zinc-50">
          DSpora
        </span>
      </div>

      <a
        href="#warteliste"
        className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
      >
        Warteliste beitreten
      </a>
    </header>
  );
}
