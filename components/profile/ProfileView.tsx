"use client";

import Link from "next/link";
import { useState } from "react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import PostCarousel from "@/components/profile/PostCarousel";
import { INTERESTS, choiceLabels } from "@/lib/onboarding";
import type { ProfilePageData } from "@/lib/profileView";

// Profilseite im Instagram-Stil: Profilbild (eckig), Spitzname, Alter, Text, Hobbys und bis zu 6 Beiträge mit Slides.
// Private Profile zeigen nur Profilbild und Spitzname.
export default function ProfileView({ data }: { data: ProfilePageData }) {
  const [open, setOpen] = useState<string | null>(null);
  const post = data.posts.find((p) => p.id === open) ?? null;
  const meta = [data.age ? `${data.age} Jahre` : null, data.city].filter(Boolean).join(" · ");
  const interests = data.interests ? choiceLabels(data.interests, INTERESTS) : [];

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/dashboard" className="text-xs text-white/70 hover:text-white">
          ← Profil
        </Link>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-md sm:p-7">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:h-28 sm:w-28">
              {data.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatar} alt={`Profilbild von ${data.displayName}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gold/80">{data.displayName.slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-zinc-50 sm:text-3xl">{data.displayName}</h1>
              {data.realName && <p className="mt-0.5 text-sm text-zinc-400">{data.realName}</p>}
              {meta && <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>}
              {data.state === "self" && (
                <Link href="/dashboard" className="mt-2 inline-block text-xs text-gold hover:underline">
                  Profil bearbeiten
                </Link>
              )}
            </div>
          </div>

          {data.state === "limited" ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
              Dieses Profil ist privat. Mehr als Profilbild und Spitzname siehst du nicht.
            </p>
          ) : (
            <>
              {data.bio && <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-zinc-200">{data.bio}</p>}
              {(data.hobbies.length > 0 || interests.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...data.hobbies, ...interests.filter((i) => data.hobbies.indexOf(i) < 0)].map((h) => (
                    <span key={h} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {data.state !== "limited" && (
          <section aria-label="Beiträge">
            {data.posts.length === 0 ? (
              <p className="rounded-3xl border border-white/10 bg-zinc-950/75 px-6 py-8 text-center text-sm text-zinc-400 backdrop-blur-md">Noch keine Beiträge.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {data.posts.map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen(p.id)} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900" aria-label={`Beitrag öffnen${p.caption ? `: ${p.caption}` : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.slides[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    {p.slides.length > 1 && <span className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">1/{p.slides.length}</span>}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
            <PostCarousel slides={post.slides} alt={post.caption ?? `Beitrag von ${data.displayName}`} />
            <div className="flex items-start justify-between gap-3 p-4">
              <p className="text-sm leading-relaxed text-zinc-200">{post.caption ?? ""}</p>
              <button type="button" onClick={() => setOpen(null)} className="shrink-0 text-xs text-zinc-400 hover:text-zinc-200">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
