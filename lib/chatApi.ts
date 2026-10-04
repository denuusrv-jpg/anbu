import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChatError } from "@/lib/chatRooms";
import { logError } from "@/lib/errorLog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const STATUS = { not_found: 404, closed: 409, invalid: 400, slow: 429, limit: 409 } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID.test(value);

/** Gemeinsamer Rahmen für alle Chat-Routen: Anmeldung prüfen, Fehler einheitlich zurückgeben. */
export async function withChatUser(
  run: (ctx: { db: SupabaseClient; userId: string }) => Promise<unknown>,
): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });

  try {
    const result = await run({ db: getServiceClient(), userId: data.user.id });
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: STATUS[error.code] });
    }
    await logError(error, "API /api/chats");
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
}
