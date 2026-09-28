import { notFound, redirect } from "next/navigation";

import { loadItinerary } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { itineraryHref } from "@/lib/types";

export default async function LegacyItineraryPage({
  params,
}: {
  params: Promise<{ creator: string; itinerarySlug: string }>;
}) {
  const { creator: slug, itinerarySlug } = await params;
  const session = await requireSession();
  const result = await loadItinerary(session.token, slug, itinerarySlug);
  if (!result) notFound();
  redirect(itineraryHref(result.story, itinerarySlug));
}
