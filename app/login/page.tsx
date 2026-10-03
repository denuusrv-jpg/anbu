import Link from "next/link";
import LoginCard from "@/components/LoginCard";
import { safeNextPath } from "@/lib/supabase/config";

export const metadata = {
  title: "Anmelden — DSpora",
  robots: { index: false, follow: false },
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16">
      <LoginCard
        next={safeNextPath(next)}
        notice={
          error === "link"
            ? "Dieser Link ist abgelaufen oder wurde schon benutzt. Fordere unten einen neuen an."
            : undefined
        }
      />
      <Link href="/" className="mt-8 text-sm text-zinc-500 hover:text-zinc-300">
        ← Zurück zur Startseite
      </Link>
    </main>
  );
}
