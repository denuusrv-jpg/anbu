import { redirect } from "next/navigation";
import DeleteConfirm from "@/components/DeleteConfirm";
import { verifyDeleteToken } from "@/lib/accountDelete";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Konto löschen — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Ziel des Links aus der Bestätigungs-Mail
export default async function DeleteAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!isSupabaseConfigured) redirect("/");
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(`/konto-loeschen?token=${token ?? ""}`)}`);
  const valid = verifyDeleteToken(token) === data.user.id;
  return <DeleteConfirm token={valid ? (token as string) : null} />;
}
