import "server-only";
import type { User } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/supabase/admin";

// Zustimmung zur Datenschutzerklärung (inkl. KI-Analyse). Liegt in den app_metadata des Kontos:
// Die kann nur der Server setzen, die Person selbst kann den Eintrag nicht verändern oder fälschen.
export const CONSENT_VERSION = "2026-10";

export function hasConsent(user: User | null | undefined): boolean {
  return Boolean(user?.app_metadata?.consent_at);
}

export async function recordConsent(userId: string): Promise<boolean> {
  const { error } = await getServiceClient().auth.admin.updateUserById(userId, {
    app_metadata: { consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION },
  });
  return !error;
}
