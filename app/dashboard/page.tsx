import DashboardPage from "@/components/DashboardPage";

export const metadata = {
  title: "KI-Check — DSpora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function Hub() {
  return <DashboardPage view="ki" path="/dashboard" />;
}
