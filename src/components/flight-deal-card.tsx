"use client";

import Image from "next/image";
import Link from "next/link";
import { Plane } from "lucide-react";

import { formatInr } from "@/lib/format";
import { dealBookHref, type PublicFlightDeal, storyHrefWithDeal } from "@/lib/types";

export function FlightDealCard({ deal, compact = false }: { deal: PublicFlightDeal; compact?: boolean }) {
  const title =
    deal.headline || `${deal.originIata} → ${deal.destinationIata} · ${deal.destinationCity}`;
  const preview = deal.storyPreview;

  return (
    <article className={`overflow-hidden rounded-2xl border border-border bg-card ${compact ? "" : "shadow-sm"}`}>
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="relative flex gap-3 p-4">
          {preview?.coverUrl ? (
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={preview.coverUrl} alt="" fill className="object-cover" sizes="64px" />
            </span>
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <Plane className="size-6" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            {deal.badge ? (
              <span className="text-xs font-medium text-primary">{deal.badge}</span>
            ) : null}
            <span className="mt-0.5 block font-display text-lg leading-snug">{title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              From {formatInr(deal.priceInr)} · {deal.departureDate}
              {deal.tripType === "return" && deal.returnDate ? ` – ${deal.returnDate}` : ""}
            </span>
          </span>
        </div>
      </Link>
      <div className="flex border-t border-border text-sm">
        <a
          href={dealBookHref(deal.id)}
          className="flex flex-1 items-center justify-center py-3 font-medium text-primary"
          rel="noopener noreferrer sponsored"
        >
          Book flight
        </a>
        {preview ? (
          <Link
            href={storyHrefWithDeal(
              { slug: preview.slug, creator: preview.creator },
              deal.id,
            )}
            className="flex flex-1 items-center justify-center border-l border-border py-3 font-medium"
          >
            Explore story
          </Link>
        ) : null}
      </div>
      <p className="px-4 pb-3 text-[11px] text-muted-foreground">Affiliate link · prices may change</p>
    </article>
  );
}
