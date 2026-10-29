import DashboardPage from "@/components/DashboardPage";

export const metadata = {
  title: "Dein Profil — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return <DashboardPage view="profil" path="/dashboard/profil" />;
}
