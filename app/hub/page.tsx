import { redirect } from "next/navigation";

// Der Hub heißt jetzt Dashboard. Alte Links (E-Mails, Lesezeichen) führen weiter dorthin.
export default function LegacyHub() {
  redirect("/dashboard");
}
