import type { FocusEvent } from "react";

// Auf dem Handy schiebt die Tastatur Eingabefelder nach unten aus dem Bild. Nach dem Antippen holen wir das Feld
// in die Mitte des sichtbaren Bereichs (zweimal: die Tastatur braucht einen Moment, bis sie ganz oben ist).
export function scrollFieldIntoView(e: FocusEvent<HTMLElement>) {
  const el = e.target;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
  if (el instanceof HTMLInputElement && ["checkbox", "radio", "button", "submit"].includes(el.type)) return;
  const run = () => el.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(run, 120);
  setTimeout(run, 450);
}
