import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import Navbar from "@/components/Navbar";
import WaitlistForm from "@/components/WaitlistForm";
import { ChatIcon, ShieldIcon, UsersIcon } from "@/components/Icons";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="relative isolate overflow-hidden">
        <FlowingWaveBackground />

        <div className="mx-auto max-w-5xl px-6 pt-6 sm:px-8">
          <Navbar />
        </div>

        {/* Hero */}
        <section className="relative mx-auto max-w-2xl px-6 pt-16 pb-20 text-center sm:px-8 sm:pt-24 sm:pb-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Startet bald in der Schweiz, Deutschland &amp; Österreich
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
            Deine neue Crew
            <br />
            wartet in deiner Stadt.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
            DSpora bringt junge Sri-Lanka-Tamil:innen in der Schweiz,
            Deutschland und Österreich in kleinen 4er-Crews zusammen — mit
            gleichen Interessen, ganz in deiner Nähe. Kein Dating, kein Druck.
          </p>

          <WaitlistForm />
        </section>
      </div>

      {/* So funktioniert's */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-8">
        <h2 className="text-center text-2xl font-semibold text-zinc-50 sm:text-3xl">
          So funktioniert's
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <UsersIcon />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-50">
              4er-Crews in deiner Region
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Die KI clustert dich mit drei Leuten aus deiner Nähe, die
              ähnliche Interessen haben — z.B. Sport, Gaming oder Kultur.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <ShieldIcon />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-50">100% diskret</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Kein Foto, keine Handynummer nötig — ihr chattet sicher direkt
              in der App, ganz ohne Stigma-Druck.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose/10 text-rose">
              <ChatIcon />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-50">
              Echte Treffen statt Chatten
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Von der App direkt zum gemeinsamen Treffen — Freundschaften vor
              Ort statt endlosem Hin-und-her-Schreiben.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-10 text-center sm:px-8">
        <p className="text-sm text-zinc-600">
          DSpora &middot; gebaut mit ♥ für die tamilische Diaspora im
          DACH-Raum
        </p>
      </footer>
    </main>
  );
}
