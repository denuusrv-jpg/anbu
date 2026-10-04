import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import HubDashboard from "@/components/HubDashboard";
import ReadyWindow from "@/components/onboarding/ReadyWindow";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { SAMPLE_ANONYMOUS, SAMPLE_BUSINESS, SAMPLE_HUBS, SAMPLE_PRIVATE, SAMPLE_WISHES } from "@/lib/previewViews";
import OnboardingDone from "@/app/onboarding/fertig/page";

export const metadata = {
  title: "Vorschau — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Eine einzelne Beispiel-Ansicht (wird von der Vorschau-Seite in einem Rahmen angezeigt).
// Nichts hier schreibt in die Datenbank, alle Aktionen sind abgeschaltet.
export default async function PreviewView({ params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) redirect("/");

  const { id } = await params;

  switch (id) {
    case "dashboard-privat":
      return (
        <HubDashboard
          email="mira@beispiel.de"
          profile={SAMPLE_PRIVATE}
          hubs={SAMPLE_HUBS}
          matchCount={0}
          isAdmin={false}
          wishes={SAMPLE_WISHES}
          preview
        />
      );
    case "dashboard-business":
      return (
        <HubDashboard
          email="mira@beispiel.de"
          profile={SAMPLE_BUSINESS}
          hubs={SAMPLE_HUBS}
          matchCount={2}
          isAdmin={false}
          wishes={SAMPLE_WISHES}
          preview
        />
      );
    case "dashboard-anonym":
      return (
        <HubDashboard
          email="anonym@beispiel.de"
          profile={SAMPLE_ANONYMOUS}
          hubs={SAMPLE_HUBS.slice(0, 1)}
          matchCount={0}
          isAdmin={false}
          wishes={[]}
          preview
        />
      );
    case "dashboard-admin":
      return (
        <HubDashboard
          email="admin@beispiel.de"
          profile={SAMPLE_PRIVATE}
          hubs={SAMPLE_HUBS}
          matchCount={0}
          isAdmin
          wishes={[]}
          preview
        />
      );
    case "startklar-gast":
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10">
          <ReadyWindow kind="guest" email="mira@beispiel.de" showResend inline />
        </main>
      );
    case "startklar-mitglied":
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10">
          <ReadyWindow kind="member" inline />
        </main>
      );
    case "startklar-fortsetzen":
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10">
          <ReadyWindow kind="resume" inline />
        </main>
      );
    case "fertig":
      return <OnboardingDone />;
    default:
      notFound();
  }
}
