"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrors";

// Letzte Auffangstelle, falls sogar das Grundgerüst der Seite abstürzt. Braucht ein eigenes <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error, "React Error Boundary (global)");
  }, [error]);

  return (
    <html lang="de">
      <body style={{ background: "#09090b", color: "#f4f4f5", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Hier ist etwas schiefgelaufen</h1>
            <p style={{ marginTop: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
              Wir wurden automatisch benachrichtigt. Versuch es bitte noch einmal.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, padding: "12px 32px", borderRadius: 999, border: 0, background: "#f2a65a", color: "#09090b", fontWeight: 600 }}
            >
              Erneut versuchen
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
