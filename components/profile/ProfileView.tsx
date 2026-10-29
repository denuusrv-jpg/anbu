"use client";

import { useTx } from "@/lib/LanguageContext";
import Link from "next/link";
import { useState } from "react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import PostCarousel from "@/components/profile/PostCarousel";
import Slider from "@/components/Slider";
import { INTERESTS, choiceLabels } from "@/lib/onboarding";
import type { ProfilePageData } from "@/lib/profileView";

// Profilseite im Instagram-Stil: Profilbild (eckig), Spitzname, Alter, Text, Hobbys und bis zu 6 Beiträge mit Slides.
// Private Profile zeigen nur Profilbild und Spitzname.
function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export default function ProfileView({ data }: { data: ProfilePageData }) {
  const tx = useTx();
  const [open, setOpen] = useState<string | null>(null);
  const post = data.posts.find((p) => p.id === open) ?? null;
  const meta = [data.age ? tx("{n} Jahre", { n: data.age }) : null, data.city].filter(Boolean).join(" · ");
  const interests = data.interests ? choiceLabels(data.interests, INTERESTS) : [];

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href={data.self || data.state === "self" ? "/dashboard/profil" : "/dashboard/chats"}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-5 py-3 text-base font-semibold text-zinc-50 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
        >
          <span aria-hidden className="text-xl leading-none">←</span>
          {tx("Profil")}
        </Link>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-md sm:p-7">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:h-28 sm:w-28">
              {data.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatar} alt={tx("Profilbild von {name}", { name: data.displayName })} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gold/80">{data.displayName.slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-zinc-50 sm:text-3xl">{data.displayName}</h1>
              {data.realName && <p className="mt-0.5 text-sm text-zinc-300">{data.realName}</p>}
              {meta && <p className="mt-0.5 text-xs text-zinc-400">{meta}</p>}
            </div>
          </div>

          {data.state === "limited" ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
              {data.self
                ? tx("Dein Profil ist privat. Andere sehen nur dein Profilbild und deinen Spitznamen.")
                : tx("Dieses Profil ist privat. Mehr als Profilbild und Spitzname siehst du nicht.")}
            </p>
          ) : (
            <>
              {data.bio && <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-zinc-200">{data.bio}</p>}
              {(data.hobbies.length > 0 || interests.length > 0) && (
                <div className="mt-5">
                  {/* Handy: größere Badges im Slider (vier pro Seite), am Desktop wie bisher als Reihe */}
                  <Slider
                    label={tx("Interessen")}
                    desktopClassName="sm:flex sm:flex-wrap sm:gap-2"
                    slides={chunk([...data.hobbies, ...interests.filter((i) => data.hobbies.indexOf(i) < 0)], 4).map((group, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 sm:contents">
                        {group.map((h) => (
                          <span
                            key={h}
                            className="flex min-h-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-sm font-medium text-zinc-100 sm:min-h-0 sm:rounded-full sm:px-3 sm:py-1 sm:text-xs sm:font-normal sm:text-zinc-300"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ))}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {data.state !== "limited" && (
          <section aria-label={tx("Beiträge")}>
            {data.posts.length === 0 ? (
              <p className="rounded-3xl border border-white/10 bg-zinc-950/75 px-6 py-8 text-center text-sm text-zinc-300 backdrop-blur-md">{tx("Noch keine Beiträge.")}</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {data.posts.map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen(p.id)} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900" aria-label={`${tx("Beitrag öffnen")}${p.caption ? `: ${p.caption}` : ""}`}>
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
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
            <PostCarousel slides={post.slides} alt={post.caption ?? tx("Beitrag von {name}", { name: data.displayName })} />
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={tx("Schließen")}
              className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-2xl leading-none text-white backdrop-blur-md transition-colors hover:bg-black/75"
            >
              ×
            </button>
            {post.caption && (
              <div className="p-4">
                <p className="text-base leading-relaxed text-zinc-100">{post.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
