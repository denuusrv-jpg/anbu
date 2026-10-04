import { redirect } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Deine Chats — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Chats() {
  if (!isSupabaseConfigured) redirect("/");
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/dashboard/chats");
  return <ChatList />;
}
