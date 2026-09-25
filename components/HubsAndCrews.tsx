const hubs = [
  "Hub NRW (Nordrhein-Westfalen)",
  "Hub Rhein-Main (Frankfurt & Hessen)",
  "Hub Baden-Württemberg",
  "Hub Bayern",
  "Hub Nord / Ost (Berlin & Hamburg)",
  "Hub Zürich & Ostschweiz",
  "Hub Wien & Österreich",
];

const groupSizes = [
  {
    emoji: "☕️",
    title: "Duo",
    badge: "2er",
    description:
      "Perfekt für entspannte 1-on-1 Coffee-Dates und lockeren Austausch.",
    accent: "teal" as const,
  },
  {
    emoji: "🍕",
    title: "Crew",
    badge: "4er",
    description:
      "Der Sweet Spot für ein gemeinsames Dinner, Bar-Abende oder Café-Treffen.",
    accent: "gold" as const,
  },
  {
    emoji: "🎉",
    title: "Squad",
    badge: "8er",
    description:
      "Für größere Events, Sommerfeste, Public Viewing oder Party-Runden.",
    accent: "rose" as const,
  },
];

const accentClasses = {
  teal: { badgeText: "text-teal", dot: "bg-teal" },
  gold: { badgeText: "text-gold", dot: "bg-gold" },
  rose: { badgeText: "text-rose", dot: "bg-rose" },
};

export default function HubsAndCrews() {
  return (
    <section
      id="erfahre-mehr"
      className="relative overflow-hidden bg-zinc-950 px-6 py-20 sm:px-8 sm:py-28"
    >
      {/* Sanfter Übergang vom Hero-Farbverlauf */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(242,166,90,0.08),transparent)]" />

      <div className="mx-auto max-w-5xl">
        {/* Teil 1: Hubs */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Der Fahrplan
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Regionale Hubs &amp; der Startschuss
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Um Ghost-Towns zu vermeiden und echte Nähe zu garantieren,
            schaltet sich eine Region erst frei, sobald 100 Anmeldungen
            erreicht sind.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((hub) => (
            <div
              key={hub}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl"
            >
              <span className="text-sm font-medium text-zinc-100">{hub}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/60 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-teal">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                Warteliste aktiv
              </span>
            </div>
          ))}
        </div>

        {/* Teil 2: Gruppengrößen */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Deine Crew, dein Vibe (2er, 4er, 8er)
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Kein starrer Zwang – wähle die Gruppengröße, die zu deinem
            sozialen Akku passt.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {groupSizes.map((group) => {
            const accent = accentClasses[group.accent];
            return (
              <div
                key={group.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                  {group.emoji}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <h3 className="font-semibold text-zinc-50">
                    {group.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/60 px-2.5 py-1 text-[10px] font-semibold ${accent.badgeText}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                    {group.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {group.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
