import Link from "next/link";
import { redirect } from "next/navigation";
import HubDashboard, { type HubProfile, type HubWish } from "@/components/HubDashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/requireAdmin";
import { REGIONS, labelOf } from "@/lib/onboarding";

export const metadata = {
  title: "Dein Hub — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Hub() {
  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-center">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h1 className="text-xl font-semibold text-zinc-50">Dein Hub kommt bald</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Die Anmeldung wird gerade eingerichtet. Danach findest du hier deinen persönlichen Bereich.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300">
            ← Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("region, city, interests, vibes, mode, profile, status, deleted_at, track, business, visibility, group_size, second_region")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  // Gelöschtes Konto (Soft-Delete): kein Zugriff mehr, solange die Frist läuft
  if (profile.deleted_at) {
    await supabase.auth.signOut();
    redirect("/");
  }

  // Eigene eingereichte Ideen (die RLS-Regeln zeigen nur die eigenen)
  const { data: wishes } = await supabase
    .from("user_wishes")
    .select("id, wish, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  // Wie viele Leute sind schon in den eigenen Hubs dabei? (zählt serverseitig über alle Profile;
  // ein Hub zählt Personen, die ihn als ersten oder zweiten Hub gewählt haben, nie doppelt)
  const hubIds = [profile.region, profile.second_region].filter((h): h is string => Boolean(h));
  let hubs: { id: string; label: string; count: number }[] | null = null;
  if (isServiceRoleConfigured()) {
    const db = getServiceClient();
    hubs = await Promise.all(
      hubIds.map(async (id) => {
        const [first, second] = await Promise.all([
          db.from("user_profiles").select("user_id", { count: "exact", head: true }).eq("region", id).is("deleted_at", null),
          db.from("user_profiles").select("user_id", { count: "exact", head: true }).eq("second_region", id).is("deleted_at", null),
        ]);
        return { id, label: labelOf(id, REGIONS), count: (first.count ?? 0) + (second.count ?? 0) };
      }),
    );
  }

  // Gegenseitige Matches (die RLS-Regeln zeigen nur die eigenen)
  const { count: matchCount } = await supabase.from("matches").select("user_a", { count: "exact", head: true });

  return (
    <HubDashboard
      email={auth.user.email ?? ""}
      profile={profile as unknown as HubProfile}
      hubs={hubs}
      matchCount={matchCount ?? 0}
      isAdmin={await isAdminRequest()}
      wishes={(wishes ?? []) as HubWish[]}
    />
  );
}
