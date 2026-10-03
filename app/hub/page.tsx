import Link from "next/link";
import { redirect } from "next/navigation";
import HubDashboard, { type HubProfile } from "@/components/HubDashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

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
  if (!auth.user) redirect("/login?next=/hub");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("region, city, interests, vibes, mode, profile, status")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  // Wie viele Leute sind schon in der eigenen Region dabei? (zählt serverseitig über alle Profile)
  let regionCount: number | null = null;
  if (isServiceRoleConfigured()) {
    const { count } = await getServiceClient()
      .from("user_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("region", profile.region);
    regionCount = count;
  }

  return (
    <HubDashboard
      email={auth.user.email ?? ""}
      profile={profile as HubProfile}
      regionCount={regionCount}
    />
  );
}
