"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { mediaUrl } from "@/lib/api";
import { resolveAdCtaUrl, type ShortAd } from "@/lib/short-ad";

export function HuesAdSlide({ ad }: { ad: ShortAd }) {
  const visual = ad.videoUrl ? mediaUrl(ad.videoUrl) : ad.imageUrl ? mediaUrl(ad.imageUrl) : "";
  const ctaHref = resolveAdCtaUrl(ad.ctaUrl);
  const ctaLabel = ad.ctaLabel.trim() || "Learn more";
  const internal = ctaHref.startsWith("/");

  return (
    <article className="relative h-full snap-start bg-[#12232a] text-white">
      {ad.videoUrl ? (
        <video
          src={mediaUrl(ad.videoUrl)}
          poster={ad.imageUrl ? mediaUrl(ad.imageUrl) : undefined}
          className="size-full object-cover"
          playsInline
          loop
          muted
          preload="metadata"
        />
      ) : visual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={visual} alt="" className="size-full object-cover" />
      ) : (
        <div className="size-full bg-gradient-to-br from-[#12232a] via-[#1a3340] to-primary/40" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
      <div className="absolute inset-x-5 bottom-24 z-10 grid gap-4 md:bottom-10">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Sponsored · {ad.sponsor}</p>
        <div className="grid gap-2">
          <h2 className="font-display text-3xl leading-tight">{ad.headline}</h2>
          {ad.body ? <p className="max-w-md text-sm leading-6 text-white/85">{ad.body}</p> : null}
        </div>
        <AdCta href={ctaHref} internal={internal} label={ctaLabel} />
      </div>
    </article>
  );
}

function AdCta({ href, internal, label }: { href: string; internal: boolean; label: string }) {
  const className =
    "pointer-events-auto inline-flex min-h-12 w-fit max-w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_rgba(225,46,47,0.35)]";

  if (internal) {
    return (
      <Link href={href} className={className}>
        {label}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <ChevronRight className="size-4" aria-hidden />
    </a>
  );
}
