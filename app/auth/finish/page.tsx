import AuthFinish from "@/components/AuthFinish";
import { safeNextPath } from "@/lib/supabase/config";

export const metadata = {
  title: "Anmeldung — DSpora",
  robots: { index: false, follow: false },
};

export default async function Finish({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <AuthFinish next={safeNextPath(next)} />
    </main>
  );
}
