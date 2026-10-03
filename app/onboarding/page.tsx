import { cookies } from "next/headers";
import Link from "next/link";
import OnboardingChat from "@/components/OnboardingChat";
import LoginCard from "@/components/LoginCard";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Onboarding — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  const { test } = await searchParams;

  // Admin-Testlauf: nur mit gültigem Admin-Cookie, es wird nichts gespeichert
  if (test === "1") {
    const store = await cookies();
    if (verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
      return <OnboardingChat mode="test" />;
    }
  }

  // Supabase noch nicht verbunden: Chat läuft im Vorschau-Modus
  if (!isSupabaseConfigured) return <OnboardingChat mode="preview" />;

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16">
        <LoginCard next="/onboarding" />
        <Link href="/" className="mt-8 text-sm text-zinc-500 hover:text-zinc-300">
          ← Zurück zur Startseite
        </Link>
      </main>
    );
  }

  return <OnboardingChat mode="live" userId={data.user.id} />;
}
