"use client";

import Image from "next/image";
import Link from "next/link";

import { PageLoader } from "@/components/loader";
import { countryFlag, countryName } from "@/lib/countries";
import { useDesk, useDeskHome } from "@/lib/studio-desk";

export function StudioHome({
  title = "Studio",
  lead = "A story is one place. Spots, plans, and blogs live inside it.",
  action = "New story",
  empty = "No stories yet. Start with the place you know best.",
  loading = "Loading your stories",
}: {
  title?: string;
  lead?: string;
  action?: string;
  empty?: string;
  loading?: string;
}) {
  const home = useDeskHome();
  const { stories, status, problem } = useDesk();

  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-10">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl">{title}</h1>
        <Link href={`${home}/new`} className="text-sm font-medium text-primary">
          {action}
        </Link>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{lead}</p>
      {status === "error" ? (
        <p className="pt-8 text-sm text-primary">{problem}</p>
      ) : stories.length === 0 && status !== "ready" ? (
        <PageLoader label={loading} />
      ) : stories.length === 0 ? (
        <p className="pt-8 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => (
            <li key={story.id}>
              <Link href={`${home}/${story.id}`} className="block">
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
  if (src.includes("images.unsplash.com")) {
    return (
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-full object-cover" />;
}
