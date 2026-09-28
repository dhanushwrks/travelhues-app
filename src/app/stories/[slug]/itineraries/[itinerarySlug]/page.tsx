import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ItineraryView } from "@/components/itinerary-view";
import { emptyLibrary } from "@/lib/marks";
import { loadItinerary, loadLibrary } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; itinerarySlug: string }>;
}): Promise<Metadata> {
  const { slug, itinerarySlug } = await params;
  const session = await requireSession();
  const result = await loadItinerary(session.token, slug, itinerarySlug);
  if (!result) return { title: "Itinerary" };
  return { title: result.itinerary.title, description: result.itinerary.summary };
}

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ slug: string; itinerarySlug: string }>;
}) {
  const { slug, itinerarySlug } = await params;
  const session = await requireSession();
  const [result, library] = await Promise.all([
    loadItinerary(session.token, slug, itinerarySlug),
    loadLibrary(session.token),
  ]);
  if (!result) notFound();

  return (
    <div className="h-full">
      <ItineraryView
        story={result.story}
        itinerary={result.itinerary}
        traveler={session.role === "traveler"}
        library={library ?? emptyLibrary}
      />
    </div>
  );
}
