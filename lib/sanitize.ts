// DSGVO-Filter für das Fehler-Tracking: entfernt alles, was auf eine Person oder einen Zugang hindeuten kann,
// bevor ein Fehler gespeichert wird. Läuft im Browser UND auf dem Server (der Server filtert immer noch einmal,
// weil er Meldungen aus dem Browser nicht blind vertrauen darf).

export const REDACTED = "[REDACTED]";

const MESSAGE_MAX = 500;
const STACK_MAX = 4000;
const PATH_MAX = 200;

// Reihenfolge ist wichtig: spezielle Muster vor den allgemeinen
const PATTERNS: [RegExp, string][] = [
  // Query-Strings und #Fragmente in URLs (dort stecken oft Tokens oder E-Mail-Adressen)
  [/(https?:\/\/[^\s?#"'<>)]+)[?#][^\s"'<>)]*/gi, `$1?${REDACTED}`],
  // E-Mail-Adressen
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, REDACTED],
  // JSON Web Tokens
  [/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g, REDACTED],
  // "Bearer xyz", "Basic xyz"
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, `$1 ${REDACTED}`],
  // password=…, "token": "…", api_key: …
  [
    /\b(password|passwort|passwd|pwd|secret|token|access_token|refresh_token|token_hash|api[_-]?key|apikey|authorization|otp|session)\b(["']?\s*[:=]\s*["']?)(?!\[REDACTED\])[^\s"'&,;)}\]]+/gi,
    `$1$2${REDACTED}`,
  ],
  // UUIDs (z. B. Nutzer-IDs)
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, REDACTED],
  // IPv4-Adressen
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, REDACTED],
  // Telefonnummern
  [/\+?\d[\d\s().-]{8,}\d/g, REDACTED],
  // Heimatverzeichnisse mit Benutzernamen (Stacktraces)
  [/\/(Users|home)\/[^/\s]+/g, `/$1/${REDACTED}`],
  [/\\Users\\[^\\\s]+/g, `\\Users\\${REDACTED}`],
  // lange Zufallsstrings (Schlüssel, Hashes, Tokens)
  [/\b[A-Za-z0-9_-]{32,}\b/g, REDACTED],
];

export function sanitizeText(value: string): string {
  let text = value;
  for (const [pattern, replacement] of PATTERNS) text = text.replace(pattern, replacement);
  return text;
}

// Fehler, die kein Mensch beheben kann oder die nur Rauschen sind
const IGNORED = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /NEXT_REDIRECT/,
  /NEXT_NOT_FOUND/,
  /^AbortError/i,
  /The user aborted a request/i,
  /Load failed$/i, // Safari bei abgebrochenen Seitenwechseln
];

export function shouldIgnore(message: string): boolean {
  return IGNORED.some((p) => p.test(message));
}

export type CleanError = { message: string; stack: string | null };

/** Macht aus einem beliebigen Fehler eine bereinigte Meldung und einen bereinigten Stacktrace. */
export function sanitizeError(error: unknown): CleanError {
  let message = "Unbekannter Fehler";
  let stack: string | null = null;
  if (error instanceof Error) {
    message = error.message || error.name || message;
    stack = error.stack ?? null;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object") {
    const e = error as { message?: unknown; stack?: unknown };
    if (typeof e.message === "string") message = e.message;
    if (typeof e.stack === "string") stack = e.stack;
  }
  return {
    message: sanitizeText(message).slice(0, MESSAGE_MAX),
    stack: stack ? sanitizeText(stack).slice(0, STACK_MAX) : null,
  };
}

/** Ort eines Fehlers: ohne Query-String und ohne IDs. */
export function cleanPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0];
  return sanitizeText(withoutQuery).slice(0, PATH_MAX) || "unbekannt";
}

/** Gleiche Fehler sollen zusammengefasst werden: Zahlen und Ziffernfolgen werden vereinheitlicht. */
export function fingerprintSource(message: string, path: string): string {
  return `${message.replace(/\d+/g, "#").toLowerCase().slice(0, 200)}|${path.replace(/\d+/g, "#")}`;
}
