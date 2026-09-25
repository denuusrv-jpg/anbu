import Link from "next/link";

export default function Mission() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-center sm:px-8">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Zurück
      </Link>

      <div className="mx-auto mt-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
          Unsere Mission
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          Für viele junge Sri-Lanka-Tamil:innen in DACH ist es schwer, abseits
          von Familie und Community neue, echte Freundschaften zu finden.
          DSpora schafft dafür einen diskreten, sicheren Ort — ganz ohne
          Stigma-Druck, ohne Druck zu daten, einfach um Menschen mit
          ähnlichen Interessen in der eigenen Region kennenzulernen.
        </p>
      </div>
    </main>
  );
}
