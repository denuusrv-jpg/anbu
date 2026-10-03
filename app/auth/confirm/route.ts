import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, safeNextPath } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Ziel des Magic-Links aus der E-Mail: prüft den Einmal-Code und startet die Sitzung.
// Funktioniert auch, wenn der Link auf einem anderen Gerät geöffnet wird.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (isSupabaseConfigured && tokenHash && type) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const failed = new URL("/login", origin);
  failed.searchParams.set("error", "link");
  failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
