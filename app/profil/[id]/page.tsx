import { notFound, redirect } from "next/navigation";
import ProfileView from "@/components/profile/ProfileView";
import { isUuid } from "@/lib/chatApi";
import { loadProfilePage } from "@/lib/profileView";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profil — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured || !isServiceRoleConfigured() || !isUuid(id)) notFound();
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/profil/${id}`);
  const page = await loadProfilePage(getServiceClient(), auth.user.id, id);
  if (!page) notFound();
  return <ProfileView data={page} />;
}
