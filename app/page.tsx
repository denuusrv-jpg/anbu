import { HeartIcon, UsersIcon } from "@/components/Icons";
import ModeCard from "@/components/ModeCard";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Dezenter Farbverlauf im Hintergrund */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(242,166,90,0.15),transparent)]" />

      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-sm font-bold text-zinc-950">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-50">
            DSpora
          </span>
        </div>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          Für Sri-Lanka-Tamil:innen in DACH
        </span>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-12 text-center sm:px-8 sm:pt-20">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Finde dein Match.
          <br />
          Oder deine Crew.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          DSpora ist die diskrete Plattform für junge Sri-Lanka-Tamil:innen in
          der Schweiz, Deutschland und Österreich — zum Verlieben oder um
          echte Freundschaften in kleinen Gruppen zu schliessen. Ganz ohne
          Stigma-Druck.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          100&nbsp;% diskret &middot; keine Nummer, kein Name ohne dein Okay
        </div>
      </section>

      {/* Die zwei Modi */}
      <section className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 px-6 sm:mt-20 sm:grid-cols-2 sm:gap-8 sm:px-8">
        <ModeCard
          accent="rose"
          icon={<HeartIcon />}
          tagline="Dating & Blind-Dating"
          title="Verliebe dich in eine Persönlichkeit"
          description="Ihr startet anonym mit Eisbrecher-Fragen. Erst wenn es zwischen euch passt, wird das Bild Schritt für Schritt scharf."
          bullets={[
            "KI-Vibe-Check statt langweiligem Formular beim Start",
            "Anonym: kein Foto, kein Name — nur Interessen & Eisbrecher-Fragen",
            "Fotos erst nach echtem Austausch oder beidseitigem Okay sichtbar",
          ]}
          ctaLabel="Warteliste beitreten"
        />

        <ModeCard
          accent="teal"
          icon={<UsersIcon />}
          tagline="Freunde & 4er-Crews"
          title="Triff neue Leute zu viert"
          description="Kein Druck, kein Dating-Stress — die KI clustert dich mit drei Leuten aus deiner Nähe, die zu dir passen."
          bullets={[
            "4er-Crews in deiner Region mit gleichen Interessen (Sport, Gaming, Kultur)",
            "Sicherer Chat direkt in der App — keine Handynummer nötig",
            "Gemeinsame Aktivitäten statt endlosem Hin-und-her-Schreiben",
          ]}
          ctaLabel="Warteliste beitreten"
        />
      </section>

      {/* Footer */}
      <footer className="mx-auto mt-20 max-w-5xl px-6 py-10 text-center sm:px-8">
        <p className="text-sm text-zinc-600">
          DSpora &middot; gebaut mit ♥ für die tamilische Diaspora im
          DACH-Raum
        </p>
      </footer>
    </main>
  );
}
