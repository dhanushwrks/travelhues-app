import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { StoryBrowser } from "@/components/story-browser";
import { StoryHero } from "@/components/story-hero";
import { emptyLibrary } from "@/lib/marks";
import { loadGlimpses, loadLibrary, loadProfile, loadStory } from "@/lib/remote";
import { getSession } from "@/lib/session";
import { storyHref } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creator: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSession();
  const story = await loadStory(session?.token, slug);
  if (!story) return { title: "Story" };
  return { title: story.title, description: story.summary };
}

export default async function StoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ creator: string; slug: string }>;
  searchParams: Promise<{ spot?: string; tab?: string }>;
}) {
  const { creator, slug } = await params;
  const { spot = "", tab = "" } = await searchParams;
  const session = await getSession();
  const guest = !session;
  const [story, library, glimpses, profile] = await Promise.all([
    loadStory(session?.token, slug),
    loadLibrary(session?.token),
    loadGlimpses(session?.token),
    loadProfile(session?.token, creator),
  ]);
  if (!story) notFound();
  if (story.creator.username !== creator) {
    const extra = new URLSearchParams();
    if (spot) extra.set("spot", spot);
    if (tab) extra.set("tab", tab);
    redirect(`${storyHref(story)}${extra.size ? `?${extra.toString()}` : ""}`);
  }

  const portrait = profile?.avatarUrl ?? story.creator.avatarUrl;
  const highlight =
    (glimpses ?? []).find((item) => item.link?.storySlug === story.slug && item.videoUrl)?.videoUrl ?? "";

  return (
    <div className="h-full overflow-y-auto">
      <StoryHero
        cover={story.coverUrl}
        videoUrl={highlight}
        portrait={portrait}
        name={story.creator.displayName}
        username={story.creator.username}
      />
      <div className="space-y-3 px-5 pt-2">
        <h1 className="font-display text-4xl md:text-5xl">{story.title}</h1>
        <p className="text-[15px] leading-6">{story.summary}</p>
      </div>
      <StoryBrowser
        story={story}
        traveler={session?.role === "traveler"}
        library={library ?? emptyLibrary}
        initialSpot={guest ? "" : spot}
        initialTab={tab === "itinerary" || tab === "blogs" ? tab : "spots"}
        guest={guest}
      />
    </div>
  );
}
