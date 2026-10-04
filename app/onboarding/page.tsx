import { cookies } from "next/headers";
import OnboardingChat from "@/components/OnboardingChat";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { isAiConfigured } from "@/lib/ai";
import { buildSteckbrief } from "@/lib/steckbrief";
import type { BusinessData, Choice, OnboardingAnswers } from "@/lib/onboarding";
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
  const aiEnabled = isAiConfigured();

  // Admin-Testlauf: nur mit gültigem Admin-Cookie, es wird nichts gespeichert
  if (test === "1") {
    const store = await cookies();
    if (verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
      return <OnboardingChat aiEnabled={aiEnabled} mode="test" />;
    }
  }

  // Supabase noch nicht verbunden: Chat läuft im Vorschau-Modus
  if (!isSupabaseConfigured) return <OnboardingChat aiEnabled={aiEnabled} mode="preview" />;

  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();

  // Gespräch fortsetzen: nur für Angemeldete mit Profil, bereits Gefragtes wird nicht wiederholt
  if (data.user && talk === "1") {
    const { data: row } = await supabase
      .from("user_profiles")
      .select("extras, deleted_at, gender, match_gender, group_size, region, second_region, city, interests, vibes, track, business")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (row && !row.deleted_at) {
      const extras = (row.extras ?? {}) as { freeText?: string; followUps?: { question: string; answer: string }[] };
      const previous = extras.followUps ?? [];
      return (
        <OnboardingChat aiEnabled={aiEnabled}
          mode="live"
          userId={data.user.id}
          resume={{
            asked: previous.map((f) => f.question),
            context: [extras.freeText ?? "", ...previous.map((f) => f.answer)].join(" "),
            steckbrief: buildSteckbrief({
              gender: row.gender,
              matchGender: row.match_gender,
              groupSize: row.group_size,
              region: row.region,
              secondRegion: row.second_region,
              city: row.city,
              interests: row.interests as Choice,
              vibes: row.vibes as Choice,
              track: row.track as "community" | "business",
              business: row.business as BusinessData | null,
              extras: row.extras as OnboardingAnswers["extras"],
            }),
          }}
        />
      );
    }
  }

  // Angemeldet: speichert direkt. Gast: Anmeldung per Link am Ende des Chats.
  return data.user ? (
    <OnboardingChat aiEnabled={aiEnabled} mode="live" userId={data.user.id} />
  ) : (
    <OnboardingChat aiEnabled={aiEnabled} mode="guest" />
  );
}
