import Link from "next/link";
import { GlobeIcon, HeartIcon, ShieldIcon, UsersIcon } from "@/components/Icons";
import MissionCard from "@/components/MissionCard";

export default function Mission() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück
        </Link>

        {/* Hero */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold uppercase backdrop-blur-md">
            Über DSpora
          </span>
          <h1 className="mt-5 text-3xl font-bold text-zinc-50 sm:text-4xl">
            Unsere Mission
          </h1>
          <p className="mx-auto mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Warum es DSpora gibt – und wofür wir stehen.
          </p>
        </div>

        {/* Sektionen */}
        <div className="mt-16 flex flex-col gap-6">
          {/* 1. Intention statt Zufall */}
          <MissionCard color="teal">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <UsersIcon />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-50 sm:text-2xl">
              Intention statt Zufall: Verbindungen nach Maß
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Wir glauben nicht an den reinen Zufall, wenn es um echte
              Freundschaften geht. Zudem deckt ein einziger Freundeskreis
              selten alle Facetten deiner Interessen ab.
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              <li className="flex gap-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                Die Menschen, mit denen du am Wochenende ausgehst, müssen
                nicht dieselben sein, mit denen du ins Fitnessstudio gehst,
                Tanzgruppen besuchst oder Videospiele zockst.
              </li>
              <li className="flex gap-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                Es spricht alles dafür, mehrere lebendige Kreise zu haben.
              </li>
              <li className="flex gap-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                Eines steht fest: Deine Optik ist hier völlig irrelevant. Es
                zählt einzig und allein, dass deine Persönlichkeit zu deinen
                Leuten passt.
              </li>
            </ul>
          </MissionCard>

          {/* 2. 100% Kostenlos & Anonym */}
          <MissionCard color="gold">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <ShieldIcon />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-50 sm:text-2xl">
              Ein Herzensprojekt: 100 % Kostenlos & Anonym
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              DSpora verfolgt keine kommerziellen Absichten – es ist ein
              reines Non-Profit-Herzensprojekt für die Community, weshalb die
              Nutzung vollkommen kostenlos bleibt.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Da es nicht immer leicht ist, den ersten Schritt zu machen,
              legen wir höchsten Wert auf Datenschutz: Du startest vollkommen
              anonym, ganz ohne Pflichtfotos oder Handynummern. Erst wenn du
              über unsere Plattform den passenden Freundeskreis gefunden hast
              und bereit bist, öffnest du dich mit Namen, Stadt oder Bildern.
            </p>
          </MissionCard>

          {/* 3. Kultur bewahren */}
          <MissionCard color="rose">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose/10 text-rose">
              <GlobeIcon />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-50 sm:text-2xl">
              Kultur bewahren: Die tamilische Diaspora im DACH-Raum
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              DSpora wurde exklusiv für die tamilische Community in
              Deutschland, Österreich und der Schweiz ins Leben gerufen. In
              einer globalisierten Welt wollen wir sicherstellen, dass unsere
              Kultur, unsere Werte und unsere Sprache im deutschsprachigen
              Raum nicht an Relevanz verlieren. Hier vernetzen sich Menschen,
              die denselben kulturellen Hintergrund teilen und genau wissen,
              worauf es ankommt.
            </p>
          </MissionCard>

          {/* 4. Einsamkeit & persönlicher Hintergrund - Highlight */}
          <MissionCard color="gold" highlight>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
              <HeartIcon />
            </div>
            <h2 className="relative mt-5 text-xl font-semibold text-zinc-50 sm:text-2xl">
              Einsamkeit, Neuanfang & Gemeinschaft: Von alt bis jung
            </h2>
            <p className="relative mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Einsamkeit ist längst kein Randphänomen, sondern eine spürbare
              Realität. Studien zeigen, dass neben jungen Erwachsenen
              zwischen 18 und 29 Jahren (Quelle: Statistisches Bundesamt /
              Kompetenznetz Einsamkeit) vor allem auch Menschen betroffen
              sind, die aus Sri Lanka geflüchtet sind. Ob ältere Generationen
              oder Personen mit Sprachbarrieren – viele stehen vor großen
              Hürden, im Alltag echten Anschluss zu finden.
            </p>

            <div className="relative mt-6 rounded-2xl border border-white/10 bg-zinc-950/40 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-zinc-200 sm:text-base">
                Genau das ist der tiefste Ursprung dieser Plattform: Der
                erste Impuls, DSpora ins Leben zu rufen, entstand, weil sich
                ein sehr guter Freund trotz eines vermeintlich guten
                Freundeskreises das Leben genommen hat – und Einsamkeit im
                stillen Raum dabei ein verheerender, oft unsichtbarer Faktor
                war. Niemand sollte sich im Alltag allein oder isoliert
                fühlen, nur weil die passenden Ansprechpartner fehlen.
              </p>
            </div>

            <p className="relative mt-6 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Durch Home-Office, digitale Isolation und den Mangel an
              natürlichen Treffpunkten zieht sich die Gesellschaft immer
              weiter zurück. DSpora schlägt hier eine Brücke von alt bis
              jung. Unsere KI sorgt dafür, dass Menschen mit denselben
              Wurzeln und passenden Interessen zueinander finden – für
              echte, vertraute Verbindungen direkt in deiner Umgebung, damit
              niemand im Stillen verloren geht.
            </p>
          </MissionCard>
        </div>

        {/* Zurück zur Startseite */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/"
            className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-gold-light"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
