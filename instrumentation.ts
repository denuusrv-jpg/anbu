import type { Instrumentation } from "next";

// Next.js ruft diese Funktion bei jedem unbehandelten Fehler auf dem Server auf
// (Seiten, Server Components, API-Routen, Proxy). So landen auch Fehler im Fehler-Tracking,
// an die niemand gedacht hat.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("./lib/errorLog");
  await logError(error, `Server (${context.routeType}): ${context.routePath || request.path}`);
};
