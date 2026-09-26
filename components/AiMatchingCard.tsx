import { AiConnectIcon, SparkleIcon } from "@/components/Icons";

export default function AiMatchingCard() {
  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl sm:px-12">
      {/* Dezentes Leuchten */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1 text-[10px] font-semibold tracking-wide text-gold uppercase">
        <SparkleIcon className="h-3 w-3" />
        Powered by AI
      </span>

      <div className="relative mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <AiConnectIcon className="h-7 w-7" />
      </div>

      <h3 className="relative mt-5 text-xl font-semibold text-zinc-50 sm:text-2xl">
        Der KI-Persönlichkeits-Check
      </h3>

      <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
        Keine starren Fragebögen. Du führst ein kurzes, entspanntes Gespräch
        mit unserer künstlichen Intelligenz. Sie versteht deinen Humor und
        deine Interessen und findet so dein perfektes Match für Duo, Crew
        oder Squad.
      </p>
    </div>
  );
}
