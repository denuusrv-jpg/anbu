import { sanitizeError, shouldIgnore } from "@/lib/sanitize";

// Browser-Seite des Fehler-Trackings: bereinigt den Fehler lokal und meldet ihn an /api/errors.
// Pro Seitenaufruf wird jede Meldung nur einmal gesendet, damit eine Fehlerschleife nicht flutet.
const sent = new Set<string>();
const MAX_PER_PAGE = 10;

export function reportClientError(error: unknown, where: string): void {
  try {
    const { message, stack } = sanitizeError(error);
    if (shouldIgnore(message)) return;
    const path = `${where} ${window.location.pathname}`;
    const key = `${message}|${path}`;
    if (sent.has(key) || sent.size >= MAX_PER_PAGE) return;
    sent.add(key);
    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, stack, path }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // bewusst still
  }
}
