import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

// Frischt die Supabase-Sitzung bei jeder Anfrage an geschützte Bereiche auf,
// damit Server-Komponenten immer gültige Cookies sehen.
export async function proxy(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

// Die statischen Seiten (Startseite, Mission, Kontakt …) bleiben unberührt und schnell.
export const config = {
  matcher: ["/hub/:path*", "/dashboard/:path*", "/profil/:path*", "/onboarding/:path*", "/auth/:path*", "/login", "/admin/:path*", "/api/:path*"],
};
