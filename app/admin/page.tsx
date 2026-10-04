import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { COPILOT_EXAMPLES } from "@/lib/adminCopilot";
import { computeKpis, loadAdminData, type AdminData } from "@/lib/adminData";
import { purgeExpired } from "@/lib/accountLifecycle";
import ErrorsPanel from "@/components/admin/ErrorsPanel";
import MatchingPanel from "@/components/admin/MatchingPanel";
import { loadChatMetrics, type ChatMetrics } from "@/lib/chatRooms";
import { loadSystemErrors, type SystemError } from "@/lib/systemErrors";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { ArrowRightIcon, BoltIcon, EyeIcon } from "@/components/Icons";

export const metadata = {
  title: "Admin — DSpora",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/");
  }

  // Daten (nur serverseitig mit dem Service-Role-Key). Abgelaufene Soft-Deletes werden dabei
  // gleich mit aufgeräumt - zusätzlich zum täglichen Job.
  let data: AdminData | null = null;
  let dataError = "";
  let systemErrors: SystemError[] | null = null;
  let chatMetrics: ChatMetrics | null = null;
  const connected = isServiceRoleConfigured();
  if (connected) {
    try {
      const db = getServiceClient();
      await purgeExpired(db).catch(() => 0);
      data = await loadAdminData(db);
      // Fehler-Tracking: fehlt die Tabelle noch, bleibt der Rest des Dashboards trotzdem nutzbar
      systemErrors = await loadSystemErrors(db).catch(() => null);
      chatMetrics = await loadChatMetrics(db).catch(() => null);
    } catch {
      dataError =
        "Die Daten konnten nicht geladen werden. Sind die Tabellen angelegt (supabase/schema.sql)?";
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold uppercase backdrop-blur-md">
            Admin
          </span>
          <AdminLogoutButton />
        </div>

        <h1 className="mt-8 text-3xl font-bold text-zinc-50 uppercase sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Du bist angemeldet. Kennzahlen, Nutzer, Wünsche und der Copilot in einem Blick.
        </p>

        {/* Werkzeuge für die Entwicklung */}
        <h2 className="mt-12 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Werkzeuge
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/onboarding?test=1"
            className="cta-premium group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition-[border-color,box-shadow] duration-300 [--sheen-alpha:0.12] hover:border-gold/50 hover:shadow-[0_0_28px_-10px_rgba(242,166,90,0.45)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <BoltIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-50">Chatbot testen</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Onboarding-Chat durchspielen (Testmodus, nichts wird gespeichert)
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
          </Link>
          <Link
            href="/admin/vorschau"
            className="cta-premium group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition-[border-color,box-shadow] duration-300 [--sheen-alpha:0.12] hover:border-gold/50 hover:shadow-[0_0_28px_-10px_rgba(242,166,90,0.45)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <EyeIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-50">Profil-Vorschau</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Beispiel-Ansichten aller Bereiche nach der Anmeldung (Dashboard, Business, Startklar-Fenster)
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
          </Link>
        </div>

        {/* Matching und Chat-Qualität */}
        {connected && (
          <>
            <h2 className="mt-12 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Matching &amp; Chats</h2>
            <div className="mt-3">
              <MatchingPanel metrics={chatMetrics} />
            </div>
          </>
        )}

        {/* Fehler-Tracking */}
        {connected && (
          <>
            <h2 className="mt-12 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Systemstatus</h2>
            <div className="mt-3">
              {systemErrors ? (
                <ErrorsPanel initial={systemErrors} />
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-zinc-400 backdrop-blur-xl">
                  Das Fehler-Tracking ist noch nicht eingerichtet (Tabelle <code>system_errors</code>, siehe
                  supabase/schema.sql).
                </p>
              )}
            </div>
          </>
        )}

        {/* Warteliste & Nutzer */}
        <h2 className="mt-12 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Übersicht
        </h2>
        <div className="mt-3">
          {!connected ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-zinc-400 backdrop-blur-xl">
              Supabase ist noch nicht verbunden. Sobald die Zugangsdaten in <code>.env.local</code> und bei Vercel
              eingetragen sind, erscheinen hier alle Wartelisten-Einträge und Profile.
            </p>
          ) : dataError ? (
            <p role="alert" className="rounded-2xl border border-rose/30 bg-rose/10 p-5 text-sm text-rose">
              {dataError}
            </p>
          ) : (
            data ? <AdminDashboard data={data} kpis={computeKpis(data)} examples={COPILOT_EXAMPLES} /> : null
          )}
        </div>
      </div>
    </main>
  );
}
