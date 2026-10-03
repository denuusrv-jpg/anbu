import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";

// Service-Role-Client: umgeht RLS und darf NIE in Browser-Code landen.
// Nur für Server-Routen verwenden, die selbst prüfen, wer fragt (z. B. Admin-Cookie).
export function isServiceRoleConfigured(): boolean {
  return Boolean(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error("Supabase Service-Role ist nicht konfiguriert.");
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
