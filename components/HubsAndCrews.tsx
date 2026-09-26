import Image from "next/image";
import HubCard from "@/components/HubCard";

const hubs = [
  "Hub NRW (Ruhrgebiet & Rheinland)",
  "Hub Rhein-Main (Frankfurt & Hessen)",
  "Hub Baden-Württemberg (Stuttgart & Südwesten)",
  "Hub Bayern & Allgäu (München & Allgäu)",
  "Hub Hauptstadt & Ost (Berlin & Ostdeutschland)",
  "Hub Hamburg & Nord (Hamburg & Norddeutschland)",
  "Hub Schweiz (Zürich & Ostschweiz)",
  "Hub Österreich (Wien & Österreich)",
];

const groupSizes = [
  {
    title: "Duo",
    image: "/duo.jpg",
    width: 500,
    height: 565,
    size: "2er Gruppe",
    description:
      "Ideal für sportliche Workouts, Joggen oder den ruhigen Austausch beim Kaffee.",
  },
  {
    title: "Crew",
    image: "/crew.jpg",
    width: 500,
    height: 565,
    size: "4er Gruppe",
    description:
      "Ideal für gemeinsame Spieleabende, Unternehmungen oder tolle Veranstaltungen.",
  },
  {
    title: "Squad",
    image: "/squad.jpg",
    width: 500,
    height: 565,
    size: "8er Gruppe",
    description:
      "Ideal für lebendige Events, gemeinsame Ausflüge oder aktive Tanzgruppen.",
  },
];

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
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hubs.map((hub) => (
            <HubCard key={hub} hub={hub} />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-center backdrop-blur-xl">
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Sobald sich 100 Personen in einer Region eintragen, öffnet sich
            das Hub. Der erste Schritt: Du erhältst eine E-Mail mit dem Link
            zu unserem KI-Persönlichkeits-Check, der dein optimales Match
            ermittelt. Das Ganze bleibt anfangs vollkommen anonym.
          </p>
        </div>

        {/* Teil 2: Gruppengrößen */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
            Gemeinschaft nach Maß
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Kein starrer Zwang – wähle die Gruppengröße, die zu deinem
            sozialen Akku passt.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {groupSizes.map((group) => (
            <div
              key={group.title}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-center backdrop-blur-xl"
            >
              <Image
                src={group.image}
                alt={group.title}
                width={group.width}
                height={group.height}
                className="w-full h-auto"
              />
              <span className="relative -mt-4 inline-flex w-fit items-center rounded-full border border-gold/20 bg-zinc-950/80 px-3 py-1 text-[11px] font-medium tracking-wide text-gold shadow-[0_0_16px_-4px_rgba(242,166,90,0.6)]">
                {group.size}
              </span>
              <p className="px-6 pt-3 pb-6 text-sm leading-relaxed text-zinc-400">
                {group.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
