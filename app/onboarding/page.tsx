import { cookies } from "next/headers";
import OnboardingChat from "@/components/OnboardingChat";
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
  searchParams: Promise<{ test?: string; talk?: string }>;
}) {
  const { test, talk } = await searchParams;

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

  // Gespräch fortsetzen: nur für Angemeldete mit Profil, bereits Gefragtes wird nicht wiederholt
  if (data.user && talk === "1") {
    const { data: row } = await supabase
      .from("user_profiles")
      .select("extras, deleted_at")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (row && !row.deleted_at) {
      const extras = (row.extras ?? {}) as { freeText?: string; followUps?: { question: string; answer: string }[] };
      const previous = extras.followUps ?? [];
      return (
        <OnboardingChat
          mode="live"
          userId={data.user.id}
          resume={{
            asked: previous.map((f) => f.question),
            context: [extras.freeText ?? "", ...previous.map((f) => f.answer)].join(" "),
          }}
        />
      );
    }
  }

  // Angemeldet: speichert direkt. Gast: Anmeldung per Link am Ende des Chats.
  return data.user ? (
    <OnboardingChat mode="live" userId={data.user.id} />
  ) : (
    <OnboardingChat mode="guest" />
  );
}
