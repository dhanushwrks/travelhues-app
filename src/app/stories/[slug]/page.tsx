import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { StoryBrowser } from "@/components/story-browser";
import { countryLabel } from "@/lib/countries";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary, loadStory } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
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
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ spot?: string }>;
}) {
  const { slug } = await params;
  const { spot = "" } = await searchParams;
  const session = await requireSession();
  const [story, library] = await Promise.all([
    loadStory(session.token, slug),
    loadLibrary(session.token),
  ]);
  if (!story) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative aspect-[4/5] bg-muted">
        <Image
          src={story.coverUrl}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="430px"
        />
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex h-11 items-center gap-1 rounded-full bg-white/90 px-3 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="size-4" />
          Explore
        </Link>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pt-20 pb-5 text-white">
          <h1 className="font-display text-5xl">{story.title}</h1>
          <p className="mt-1 text-sm">{countryLabel(story.destination.country)}</p>
        </div>
      </div>
      <div className="space-y-4 px-5 pt-5">
        <Link
          href={`/u/${story.creator.username}`}
          className="flex items-center gap-3"
        >
          <span className="relative size-11 overflow-hidden rounded-full bg-muted">
            <Image
              src={story.creator.avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
            />
          </span>
          <span>
            <span className="block text-sm text-muted-foreground">Story by</span>
            <span className="block text-base font-medium">
              {story.creator.displayName}
            </span>
          </span>
        </Link>
        <p className="text-[15px] leading-6">{story.summary}</p>
      </div>
      <StoryBrowser
        story={story}
        traveler={session.role === "traveler"}
        library={library ?? emptyLibrary}
        initialSpot={spot}
      />
    </div>
  );
}
