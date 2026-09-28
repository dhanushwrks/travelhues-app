import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { StoryBrowser } from "@/components/story-browser";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary, loadStory } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { storyHref, storyImages } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creator: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await requireSession();
  const story = await loadStory(session.token, slug);
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
  const session = await requireSession();
  const [story, library] = await Promise.all([
    loadStory(session.token, slug),
    loadLibrary(session.token),
  ]);
  if (!story) notFound();
  if (story.creator.username !== creator) {
    const extra = new URLSearchParams();
    if (spot) extra.set("spot", spot);
    if (tab) extra.set("tab", tab);
    redirect(`${storyHref(story)}${extra.size ? `?${extra.toString()}` : ""}`);
  }

  const images = storyImages(story);

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative">
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {images.map((src) => (
            <div
              key={src}
              className={`relative aspect-[4/5] shrink-0 snap-center bg-muted md:aspect-[16/8] md:max-h-[32rem] ${
                images.length > 1 ? "w-[86%]" : "w-full"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={src === images[0]}
                className="object-cover"
                sizes="(min-width: 768px) 72rem, 100vw"
              />
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex h-11 items-center gap-1 rounded-full bg-white/90 px-3 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="size-4" />
          Explore
        </Link>
      </div>
      <div className="space-y-3 px-5 pt-5">
        <h1 className="font-display text-4xl md:text-5xl">{story.title}</h1>
        <p className="text-[15px] leading-6">{story.summary}</p>
        <Link href={`/u/${story.creator.username}`} className="inline-flex items-center gap-2 text-sm">
          <span className="relative size-8 overflow-hidden rounded-full bg-muted">
            <Image src={story.creator.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
          </span>
          <span className="font-medium">{story.creator.displayName}</span>
        </Link>
      </div>
      <StoryBrowser
        story={story}
        traveler={session.role === "traveler"}
        library={library ?? emptyLibrary}
        initialSpot={spot}
        initialTab={tab === "itinerary" || tab === "blogs" ? tab : "spots"}
      />
    </div>
  );
}
