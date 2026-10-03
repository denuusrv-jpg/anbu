import "server-only";
import { createHash } from "node:crypto";
import { cleanPath, fingerprintSource, sanitizeError, shouldIgnore } from "@/lib/sanitize";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

// Meldet einen Fehler an die Tabelle system_errors. Gleiche Fehler werden von der Datenbank zusammengefasst
// (Zähler +1 statt neuer Zeile). Der Logger wirft nie selbst einen Fehler: ein Fehler beim Fehler-Melden
// darf die App nicht zusätzlich stören.
export async function logError(error: unknown, componentPath: string): Promise<void> {
  try {
    const { message, stack } = sanitizeError(error);
    if (shouldIgnore(message)) return;
    const path = cleanPath(componentPath);

    if (!isServiceRoleConfigured()) {
      console.error(`[Fehler] ${path}: ${message}`);
      return;
    }

    const fingerprint = createHash("sha256").update(fingerprintSource(message, path)).digest("hex");
    await getServiceClient().rpc("log_system_error", {
      p_fingerprint: fingerprint,
      p_message: message,
      p_path: path,
      p_stack: stack,
    });
  } catch {
    // bewusst still
  }
}
