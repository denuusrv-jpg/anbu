"use client";

import { useState } from "react";
import { PREVIEW_VIEWS } from "@/lib/previewViews";

const DEVICES = [
  { id: "phone", label: "Handy", width: 390, height: 780 },
  { id: "desktop", label: "Desktop", width: 1100, height: 780 },
] as const;

// Zeigt eine Beispiel-Ansicht in einem Rahmen in Handy- oder Desktop-Breite.
// Die Ansicht ist eine echte Seite (/admin/vorschau/ansicht/…), deshalb stimmt die Darstellung mit dem Live-Stand überein.
export default function PreviewFrame() {
  const [viewId, setViewId] = useState(PREVIEW_VIEWS[0].id);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("phone");
  const [reload, setReload] = useState(0);

  const view = PREVIEW_VIEWS.find((v) => v.id === viewId) ?? PREVIEW_VIEWS[0];
  const dev = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const src = `/admin/vorschau/ansicht/${view.id}`;

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-gold/60 bg-gold/15 text-gold"
        : "border-white/10 bg-white/5 text-zinc-300 hover:border-gold/40 hover:text-gold"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {PREVIEW_VIEWS.map((v) => (
          <button key={v.id} type="button" onClick={() => setViewId(v.id)} className={pill(v.id === viewId)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{view.description}</p>
        <div className="flex items-center gap-2">
          {DEVICES.map((d) => (
            <button key={d.id} type="button" onClick={() => setDevice(d.id)} className={pill(d.id === device)}>
              {d.label}
            </button>
          ))}
          <button type="button" onClick={() => setReload((n) => n + 1)} className={pill(false)}>
            Neu laden
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer" className={pill(false)}>
            In neuem Tab
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <iframe
          key={`${view.id}-${device}-${reload}`}
          src={src}
          title={view.label}
          style={{ width: dev.width, height: dev.height }}
          className="mx-auto block max-w-full rounded-2xl border border-white/10 bg-zinc-950"
        />
      </div>
    </div>
  );
}
