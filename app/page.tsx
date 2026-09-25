import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import Navbar from "@/components/Navbar";
import WaitlistForm from "@/components/WaitlistForm";
import HubsAndCrews from "@/components/HubsAndCrews";
import { ChatIcon, ShieldIcon, UsersIcon } from "@/components/Icons";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <FlowingWaveBackground />

        {/* Hero — takes the full first screen */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 sm:px-8">
          <section className="relative mx-auto flex max-w-2xl flex-1 flex-col justify-center py-16 text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="DSpora Community"
                width={1548}
                height={454}
                priority
                className="h-12 w-auto sm:h-16"
              />
            </div>

            <div className="mb-12">
              <Navbar />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
              Deine neuen Connection
              <br />
              warten in deiner Umgebung
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white sm:text-lg">
              Finde dein Duo, deine Crew oder deine Squad.
              <br />
              100&nbsp;% kostenlos &amp; exklusiv für die Tamil-Community in
              DACH.
            </p>

            <WaitlistForm />
          </section>
        </div>
      </div>

      <HubsAndCrews />

      {/* Funktionen */}
      <section id="funktionen" className="mx-auto max-w-5xl px-6 py-20 sm:px-8">
        <h2 className="text-center text-2xl font-semibold text-zinc-50 sm:text-3xl">
          Funktionen
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
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-600">
          <Link href="/impressum" className="hover:text-zinc-400">
            Impressum
          </Link>
          <span>&middot;</span>
          <Link href="/datenschutz" className="hover:text-zinc-400">
            Datenschutz
          </Link>
        </div>
      </footer>
    </main>
  );
}
