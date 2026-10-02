import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plane } from "lucide-react";

import { CreatorCard } from "@/components/creator-card";
import { countryLabel } from "@/lib/countries";
import { dealDaysLeft, formatDealDateRange } from "@/lib/flight-deal-utils";
import { formatInr } from "@/lib/format";
import {
  loadCreators,
  loadDestinations,
  loadFlightDeal,
  loadStory,
} from "@/lib/remote";
import { getSession } from "@/lib/session";
import {
  dealBookHref,
  itineraryHref,
  storyHrefWithDeal,
  type Itinerary,
  type Story,
} from "@/lib/types";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const token = session?.token;
  const deal = await loadFlightDeal(id);
  if (!deal) notFound();

  const preview = deal.storyPreview;
  const [story, destinations, creatorsPage] = await Promise.all([
    deal.storySlug ? loadStory(token, deal.storySlug) : Promise.resolve(null),
    loadDestinations(token, { country: deal.destinationCountry, limit: 8 }),
    loadCreators(token, { country: deal.destinationCountry, limit: 6 }),
  ]);

  const itineraries = collectItineraries(story, destinations ?? [], deal.featuredItinerarySlug);
  const daysLeft = dealDaysLeft(deal.dealEndsAt);
  const countryName = countryLabel(deal.destinationCountry);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto pb-28">
        <div className="relative h-44 bg-muted">
          {preview?.coverUrl ? (
            <Image src={preview.coverUrl} alt="" fill className="object-cover" sizes="100vw" priority />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <Link
            href="/deals"
            className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-sm font-medium backdrop-blur-sm"
          >
            ← Deals
          </Link>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-xs text-muted-foreground">Trip to</p>
            <h1 className="font-display text-3xl leading-tight">{deal.destinationCity}</h1>
            <p className="text-sm text-muted-foreground">{countryName}</p>
          </div>
        </div>

        <div className="grid gap-3 px-5 pt-4">
          <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-xs font-semibold">
              {deal.airlineName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Date & seating</p>
              <p className="font-medium">
                {deal.travelMonthLabel} · {deal.cabinClass}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Departure</p>
            <FlightLeg from={deal.originIata} to={deal.destinationIata} stops={deal.stopsLabel} />
            {deal.returnDate ? (
              <>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Return</p>
                <FlightLeg from={deal.destinationIata} to={deal.originIata} stops={deal.stopsLabel} />
              </>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {formatDealDateRange(deal.departureDate, deal.returnDate)}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Included baggage</p>
            <p className="mt-1 font-medium">{deal.baggageSummary}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Confirm baggage allowance on the partner site before booking.
            </p>
          </section>

          {preview ? (
            <Link
              href={storyHrefWithDeal({ slug: preview.slug, creator: preview.creator }, deal.id)}
              className="rounded-2xl border border-border bg-card p-4 text-sm font-medium shadow-sm"
            >
              Explore story · {preview.title}
            </Link>
          ) : null}
        </div>

        {itineraries.length > 0 ? (
          <section className="mt-8 px-5">
            <h2 className="font-display text-xl">Plans for this trip</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Itineraries that pair with this fare.
            </p>
            <ul className="mt-4 grid gap-2">
              {itineraries.map((item) => (
                <li key={`${item.storySlug}-${item.itinerary.slug}`}>
                  <Link
                    href={`${itineraryHref(
                      { slug: item.storySlug, creator: item.creator },
                      item.itinerary.slug,
                    )}?deal=${deal.id}`}
                    className="block rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <p className="font-medium">{item.itinerary.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.storyTitle} · {item.itinerary.days.length} days
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {creatorsPage?.items?.length ? (
          <section className="mt-8 px-5 pb-4">
            <h2 className="font-display text-xl">Creators in {countryName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              People who have explored this country on Travelhues.
            </p>
            <ul className="mt-4 grid gap-3">
              {creatorsPage.items.map((creator) => (
                <li key={creator.username}>
                  <CreatorCard
                    guest={!token}
                    creator={{
                      username: creator.username,
                      displayName: creator.displayName,
                      avatarUrl: creator.avatarUrl,
                      coverUrl: creator.coverUrl,
                      blurb: creator.blurb,
                      stories: creator.stories,
                      countries: creator.countries,
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <footer className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            {deal.listPriceInr > deal.priceInr ? (
              <p className="text-sm text-muted-foreground line-through">{formatInr(deal.listPriceInr)}</p>
            ) : null}
            <p className="text-xl font-semibold text-primary">{formatInr(deal.priceInr)}</p>
            <p className="text-xs text-muted-foreground">
              {daysLeft > 0 ? `Deal lasts ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : "Ending soon"}
              {deal.offerPercent > 0 ? ` · ${deal.offerPercent}% off` : ""}
            </p>
          </div>
          <a
            href={dealBookHref(deal.id)}
            className="inline-flex h-11 min-w-[8.5rem] items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            rel="noopener noreferrer sponsored"
          >
            Book now
          </a>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">Affiliate link · prices may change</p>
      </footer>
    </div>
  );
}

function FlightLeg({
  from,
  to,
  stops,
}: {
  from: string;
  to: string;
  stops: string;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <div>
        <p className="font-display text-2xl">{from}</p>
        <p className="text-xs text-muted-foreground">From</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2">
        <Plane className="size-4 rotate-90 text-muted-foreground" aria-hidden />
        <span className="w-full border-t border-dashed border-border" />
        <span className="text-[10px] text-muted-foreground">{stops}</span>
      </div>
      <div className="text-right">
        <p className="font-display text-2xl">{to}</p>
        <p className="text-xs text-muted-foreground">To</p>
      </div>
    </div>
  );
}

function collectItineraries(
  linkedStory: Story | null,
  countryStories: Story[],
  featuredSlug: string,
) {
  const rows: {
    storySlug: string;
    storyTitle: string;
    creator: Story["creator"];
    itinerary: Itinerary;
  }[] = [];
  const seen = new Set<string>();

  const pushStory = (story: Story, preferSlug?: string) => {
    const plans = story.itineraries.filter((item) => !item.archived);
    const ordered = preferSlug
      ? [...plans].sort((a, b) => (a.slug === preferSlug ? -1 : b.slug === preferSlug ? 1 : 0))
      : plans;
    for (const itinerary of ordered.slice(0, 3)) {
      const key = `${story.slug}:${itinerary.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        storySlug: story.slug,
        storyTitle: story.title,
        creator: story.creator,
        itinerary,
      });
    }
  };

  if (linkedStory) pushStory(linkedStory, featuredSlug);
  for (const story of countryStories) {
    if (rows.length >= 6) break;
    pushStory(story);
  }
  return rows.slice(0, 6);
}
