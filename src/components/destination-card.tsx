import Image from "next/image";
import Link from "next/link";

import { MarkControls } from "@/components/mark-controls";
import { countryLabel } from "@/lib/countries";
import { markState, type Library } from "@/lib/marks";
import type { Story } from "@/lib/types";

export function DestinationCard({
  story,
  traveler,
  library,
}: {
  story: Story;
  traveler: boolean;
  library: Library;
}) {
  return (
    <article className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <Link href={`/stories/${story.slug}`} className="block">
        <span className="relative block aspect-[16/9] bg-muted">
          <Image src={story.coverUrl} alt="" fill className="object-cover" sizes="430px" />
        </span>
        <span className="block px-4 pt-3">
          <span className="block font-display text-2xl">{story.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {countryLabel(story.destination.country)} · {story.creator.displayName}
          </span>
        </span>
      </Link>
      {story.itineraries.length > 0 ? (
        <ul className="mt-3 divide-y divide-border px-4 pb-3">
          {story.itineraries.map((itinerary) => {
            const state = markState(library, "itinerary", story.slug, itinerary.slug);
            return (
              <li key={itinerary.slug} className="grid gap-2 py-3">
                <Link href={`/stories/${story.slug}/itineraries/${itinerary.slug}`}>
                  <span className="block text-base font-medium">{itinerary.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {itinerary.days.length} {itinerary.days.length === 1 ? "day" : "days"}
                  </span>
                </Link>
                <MarkControls
                  traveler={traveler}
                  storySlug={story.slug}
                  kind="itinerary"
                  itinerarySlug={itinerary.slug}
                  liked={state.liked}
                  saved={state.saved}
                  likes={state.likes}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
