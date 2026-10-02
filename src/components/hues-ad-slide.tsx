"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { mediaUrl } from "@/lib/api";
import { resolveAdCtaUrl, type ShortAd } from "@/lib/short-ad";

/** Sponsored hue-style slide: partner profile + 9:16 highlight + CTA. */
export function HuesAdSlide({ ad }: { ad: ShortAd }) {
  const poster = ad.imageUrl ? mediaUrl(ad.imageUrl) : "";
  const video = ad.videoUrl ? mediaUrl(ad.videoUrl) : "";
  const avatar = ad.partnerAvatarUrl ? mediaUrl(ad.partnerAvatarUrl) : "";
  const ctaHref = resolveAdCtaUrl(ad.ctaUrl);
  const ctaLabel = ad.ctaLabel.trim() || "Learn more";
  const internal = ctaHref.startsWith("/");
  const initial = ad.partnerName.slice(0, 1);

  return (
    <article className="relative h-full snap-start bg-black text-white">
      <AdCreative916 poster={poster} video={video} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-4 bottom-24 flex items-end gap-3 pr-4 md:bottom-6">
        <span
          className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white"
          aria-hidden
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-medium">{initial}</span>
          )}
        </span>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="grid gap-0.5">
            <p className="text-sm font-medium">{ad.partnerName}</p>
            <p className="text-xs text-white/75">
              {ad.category}
              <span className="text-white/50"> · Sponsored</span>
            </p>
          </div>
          <p className="text-sm leading-5">{ad.headline}</p>
          {ad.body ? <p className="text-xs leading-5 text-white/80">{ad.body}</p> : null}
          <AdCta href={ctaHref} internal={internal} label={ctaLabel} />
        </div>
      </div>
    </article>
  );
}

function AdCreative916({ poster, video }: { poster: string; video: string }) {
  const [videoReady, setVideoReady] = useState(Boolean(video));
  const showVideo = Boolean(video) && videoReady;

  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      <div className="relative mx-auto aspect-[9/16] h-full w-auto max-w-full">
        {showVideo ? (
          <video
            src={video}
            poster={poster || undefined}
            className="absolute inset-0 size-full object-cover"
            playsInline
            loop
            muted
            preload="metadata"
            onError={() => setVideoReady(false)}
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#12232a] via-[#1a3340] to-primary/40" />
        )}
      </div>
    </div>
  );
}

function AdCta({ href, internal, label }: { href: string; internal: boolean; label: string }) {
  const className =
    "pointer-events-auto inline-flex min-h-10 w-fit max-w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_rgba(225,46,47,0.35)]";

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
