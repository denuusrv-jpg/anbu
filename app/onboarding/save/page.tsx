import { redirect } from "next/navigation";
import ClaimDraft from "@/components/ClaimDraft";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profil anlegen — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SaveDraft() {
  if (!isSupabaseConfigured) redirect("/onboarding");
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/onboarding/save");

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <ClaimDraft />
    </main>
  );
}
