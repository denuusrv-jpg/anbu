import Link from "next/link";
import ContactForm from "@/components/ContactForm";

const faqs = [
  {
    question: "Wie schnell bekomme ich eine Antwort?",
    answer:
      "Wir sind ein kleines, ehrenamtliches Team – in der Regel meldet sich innerhalb weniger Tage jemand bei dir zurück.",
  },
  {
    question: "Muss ich viel über mich preisgeben?",
    answer:
      "Nein. Dein Name ist optional, wir brauchen nur eine E-Mail-Adresse, um dir antworten zu können.",
  },
  {
    question: "Ich möchte ein Sicherheitsanliegen melden.",
    answer:
      "Wähle oben „Sicherheit & Support“ aus – solche Nachrichten behandeln wir bevorzugt und vertraulich.",
  },
];

export default function Kontakt() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück
        </Link>

        {/* Hero */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold uppercase backdrop-blur-md">
            Kontakt
          </span>
          <h1 className="mt-5 text-3xl font-bold text-zinc-50 uppercase sm:text-4xl">
            Schreib uns
          </h1>
          <p className="mx-auto mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Fragen, Feedback oder eine Idee? Wähle unten kurz das passende
            Thema und schick uns eine Nachricht.
          </p>
        </div>

        {/* Kontaktformular */}
        <div className="mt-14">
          <ContactForm />
        </div>

        {/* Gut zu wissen */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-10">
          <h2 className="text-lg font-semibold text-zinc-50">Gut zu wissen</h2>
          <div className="mt-5 flex flex-col divide-y divide-white/10">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-zinc-100">
                  {faq.question}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
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
