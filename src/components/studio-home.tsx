"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { countryFlag, countryName } from "@/lib/countries";
import { storiesServerSnapshot, storiesSnapshot, subscribeStudio } from "@/lib/mock/studio";

export function StudioHome() {
  const stories = useSyncExternalStore(subscribeStudio, storiesSnapshot, storiesServerSnapshot);

  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-10">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl">Studio</h1>
        <Link href="/studio/new" className="text-sm font-medium text-primary">
          New story
        </Link>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        A story is one place. Spots, plans, and blogs live inside it.
      </p>
      {stories.length === 0 ? (
        <p className="pt-8 text-sm text-muted-foreground">No stories yet. Start with the place you know best.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {stories.map((story) => (
            <li key={story.id}>
              <Link href={`/studio/${story.id}`} className="block">
                <span className="relative block aspect-[16/9] overflow-hidden rounded-3xl bg-secondary">
                  <Cover src={story.coverUrl} />
                </span>
                <span className="mt-3 block text-lg font-medium">{story.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {countryFlag(story.country)} {countryName(story.country)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cover({ src }: { src: string }) {
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="size-full object-cover" />;
  }
  return <Image src={src} alt="" fill className="object-cover" sizes="430px" />;
}
