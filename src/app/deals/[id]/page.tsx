import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatInr } from "@/lib/format";
import { loadFlightDeal } from "@/lib/remote";
import { dealBookHref, itineraryHref, storyHrefWithDeal } from "@/lib/types";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await loadFlightDeal(id);
  if (!deal) notFound();

  const preview = deal.storyPreview;
  const title =
    deal.headline || `${deal.originIata} → ${deal.destinationIata} · ${deal.destinationCity}`;

  return (
    <div className="h-full overflow-y-auto px-5 pb-12 pt-8">
      <Link href="/deals" className="text-sm font-medium text-muted-foreground">
        ← All deals
      </Link>
      <h1 className="mt-4 font-display text-3xl">{title}</h1>
      {deal.subtitle ? <p className="mt-2 text-muted-foreground">{deal.subtitle}</p> : null}
      <p className="mt-3 text-lg font-medium">
        From {formatInr(deal.priceInr)} · {deal.departureDate}
        {deal.returnDate ? ` – ${deal.returnDate}` : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Affiliate link · prices may change</p>
      <div className="mt-6 grid gap-3">
        <a
          href={dealBookHref(deal.id)}
          className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
          rel="noopener noreferrer sponsored"
        >
          Book flight
        </a>
        {preview ? (
          <Link
            href={storyHrefWithDeal({ slug: preview.slug, creator: preview.creator }, deal.id)}
            className="flex h-12 items-center justify-center rounded-full bg-secondary text-sm font-medium"
          >
            Explore {preview.title}
          </Link>
        ) : null}
        {preview && deal.featuredItinerarySlug ? (
          <Link
            href={`${itineraryHref({ slug: preview.slug, creator: preview.creator }, deal.featuredItinerarySlug)}?deal=${deal.id}`}
            className="text-center text-sm font-medium underline"
          >
            Featured itinerary
          </Link>
        ) : null}
      </div>
      {preview?.coverUrl ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <Image src={preview.coverUrl} alt="" fill className="object-cover" sizes="100vw" />
        </div>
      ) : null}
    </div>
  );
}
