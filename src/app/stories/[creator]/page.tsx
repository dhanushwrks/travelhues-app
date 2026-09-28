import { notFound, redirect } from "next/navigation";

import { loadStory } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { storyHref } from "@/lib/types";

export default async function LegacyStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ creator: string }>;
  searchParams: Promise<{ spot?: string; tab?: string }>;
}) {
  const { creator: slug } = await params;
  const query = await searchParams;
  const session = await requireSession();
  const story = await loadStory(session.token, slug);
  if (!story) notFound();
  const extra = new URLSearchParams();
  if (query.spot) extra.set("spot", query.spot);
  if (query.tab) extra.set("tab", query.tab);
  redirect(`${storyHref(story)}${extra.size ? `?${extra.toString()}` : ""}`);
}
