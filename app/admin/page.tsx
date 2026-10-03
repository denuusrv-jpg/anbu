import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const metadata = {
  title: "Admin — DSpora",
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold uppercase backdrop-blur-md">
            Admin
          </span>
          <AdminLogoutButton />
        </div>

        <h1 className="mt-8 text-3xl font-bold text-zinc-50 uppercase sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Du bist angemeldet. Hier entsteht später die Übersicht, zum Beispiel
          die Warteliste.
        </p>
      </div>
    </main>
  );
}
