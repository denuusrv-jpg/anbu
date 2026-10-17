import type { User } from "@supabase/supabase-js";

// Erste Anmeldung nach der Registrierung: Der Link wurde zum ersten Mal geklickt, die Bestätigung der E-Mail und die
// Anmeldung liegen dann (fast) gleichzeitig. Nur dann führt der Weg automatisch in den Fragenkatalog.
// Danach geht es immer direkt ins Profil.
export function isFirstLogin(user: User): boolean {
  const confirmed = user.email_confirmed_at ? new Date(user.email_confirmed_at).getTime() : NaN;
  const last = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : NaN;
  if (Number.isNaN(confirmed) || Number.isNaN(last)) return false;
  return Math.abs(last - confirmed) < 2 * 60 * 1000;
}
