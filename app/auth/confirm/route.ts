import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, safeNextPath } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Ziel des Magic-Links aus der E-Mail. Unterstützt drei Varianten:
// 1) token_hash  - eigene Mail-Vorlage (funktioniert auch auf einem anderen Gerät)
// 2) code        - PKCE-Ablauf im selben Browser
// 3) Standard-Vorlage von Supabase: die Anmeldedaten stehen nach dem "#" im Link und sind
//    für den Server unsichtbar - dann übernimmt die Seite /auth/finish im Browser.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  if (isSupabaseConfigured) {
    const supabase = await getServerClient();
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } else {
      // Ein "#…" am Link bleibt bei dieser Weiterleitung erhalten
      const finish = new URL("/auth/finish", origin);
      finish.searchParams.set("next", next);
      return NextResponse.redirect(finish);
    }
  }

  const failed = new URL("/login", origin);
  failed.searchParams.set("error", "link");
  failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
