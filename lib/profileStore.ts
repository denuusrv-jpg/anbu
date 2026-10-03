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
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      region: answers.region,
      city: answers.city ?? null,
      interests: answers.interests,
      vibes: answers.vibes,
      mode: answers.mode,
      profile: answers.profile ?? null,
      extras: answers.extras ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) return false;

  // Wartelisten-Eintrag als "onboarded" markieren (nicht kritisch)
  if (user.email && isServiceRoleConfigured()) {
    await getServiceClient()
      .from("waitlist")
      .update({ status: "onboarded" })
      .eq("email", user.email.toLowerCase());
  }
  return true;
}
