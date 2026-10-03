import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

// Schreibt die Antworten als Profil des eingeloggten Nutzers. Der Nutzer schreibt mit seiner
// eigenen Sitzung, die RLS-Regeln erlauben nur die eigene Zeile.
export async function saveProfile(
  supabase: SupabaseClient,
  user: User,
  answers: OnboardingAnswers,
): Promise<boolean> {
  // Wünsche/Ideen für DSpora liegen in einer eigenen Tabelle (Co-Creation), nicht im Profil
  const wishes = answers.extras?.wishes?.trim();
  const extras = answers.extras ? { ...answers.extras, wishes: undefined } : null;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      group_size: answers.groupSize ?? null,
      region: answers.region,
      second_region: answers.secondRegion ?? null,
      city: answers.city ?? null,
      interests: answers.interests,
      vibes: answers.vibes,
      mode: answers.mode,
      track: answers.track ?? "community",
      business: answers.business ?? null,
      // Sichtbarkeit liegt als eigene Spalte (wird von der Datenbank durchgesetzt), nicht im Profil-JSON
      visibility: answers.profile?.visibility ?? "stealth",
      profile: answers.profile ? { ...answers.profile, visibility: undefined } : null,
      extras,
      deleted_at: null,
    },
    { onConflict: "user_id" },
  );
  if (error) return false;

  if (wishes) {
    // Dieselbe Idee nicht doppelt ablegen, wenn jemand den Chat erneut durchläuft
    const { data: same } = await supabase
      .from("user_wishes")
      .select("id")
      .eq("user_id", user.id)
      .eq("wish", wishes)
      .limit(1);
    if (!same || same.length === 0) {
      await supabase.from("user_wishes").insert({ user_id: user.id, wish: wishes });
    }
  }

  // Wartelisten-Eintrag als "onboarded" markieren (nicht kritisch)
  if (user.email && isServiceRoleConfigured()) {
    await getServiceClient()
      .from("waitlist")
      .update({ status: "onboarded" })
      .eq("email", user.email.toLowerCase());
  }
  return true;
}
