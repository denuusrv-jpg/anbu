import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import PreviewFrame from "@/components/admin/PreviewFrame";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";

export const metadata = {
  title: "Profil-Vorschau — DSpora",
  robots: { index: false, follow: false },
};

export default async function Vorschau() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) redirect("/");

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück zum Admin
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-zinc-50 uppercase sm:text-4xl">Profil-Vorschau</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          So sehen die Bereiche nach der Anmeldung aktuell aus, mit Beispieldaten. Die Ansichten nutzen die echten Seiten
          und Komponenten und aktualisieren sich daher automatisch, wenn du etwas verbesserst. Es wird nichts gespeichert.
        </p>
        <div className="mt-10">
          <PreviewFrame />
        </div>
      </div>
    </main>
  );
}
