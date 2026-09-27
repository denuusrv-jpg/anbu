"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon } from "@/components/Icons";
import { useLanguage } from "@/lib/LanguageContext";
import Translated from "@/components/Translated";

export default function ShareLinkBadge() {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-gold"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-gold" />
          <Translated text={t.share.copied} />
        </>
      ) : (
        <>
          <LinkIcon className="h-3.5 w-3.5" />
          <Translated text={t.share.text} />
        </>
      )}
    </button>
  );
}
