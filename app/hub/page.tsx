import { redirect } from "next/navigation";

// Der Hub heißt jetzt Profil. Alte Links (E-Mails, Lesezeichen) führen weiter dorthin.
export default function LegacyHub() {
  redirect("/dashboard");
}
