import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

let client: ReturnType<typeof createBrowserClient> | undefined;

// Browser-Client mit aktivierter (experimenteller) Passkey-Unterstützung
export function getBrowserClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: { experimental: { passkey: true } },
    });
  }
  return client;
}
