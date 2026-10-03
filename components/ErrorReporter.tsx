"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrors";

// Fängt Fehler im Browser, die sonst niemand sieht: Skriptfehler und nicht abgefangene Promise-Fehler.
// (Fehler in React-Komponenten fangen die Error-Boundaries in app/error.tsx und app/global-error.tsx.)
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError(event.error ?? event.message, "Browser");
    const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason, "Browser (Promise)");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
