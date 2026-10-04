import { notFound, redirect } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";
import { isUuid } from "@/lib/chatApi";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Chat — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  if (!isSupabaseConfigured) redirect("/");
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/dashboard/chats/${id}`);
  return <ChatRoom roomId={id} />;
}
