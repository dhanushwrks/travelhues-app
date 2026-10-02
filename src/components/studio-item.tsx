"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink, MapPin, Pencil } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { ItineraryView } from "@/components/itinerary-view";
import { Loader, PageLoader } from "@/components/loader";
import { readCookie } from "@/lib/browser-session";
import { formatInr } from "@/lib/format";
import { emptyLibrary } from "@/lib/marks";
import { blogMarkup, categoryName, type StoryTab } from "@/lib/mock/studio";
import { deskPlanAsPublic, deskStoryAsPublic, useDesk, useDeskHome } from "@/lib/studio-desk";

const PinMap = dynamic(() => import("@/components/maps").then((mod) => mod.PinMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-40 place-items-center bg-muted">
      <Loader className="size-5 text-primary" />
    </div>
  ),
});

export function StudioItem({
  storyId,
  tab,
  itemId,
}: {
  storyId: string;
  tab: StoryTab;
  itemId: string;
}) {
  const home = useDeskHome();
  const trip = home === "/plans";
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const back = `${home}/${storyId}?tab=${tab}`;

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <BackLink href={home} />
        {status === "error" ? <p className="pt-6 text-sm text-primary">{problem}</p> : <PageLoader label="Loading the story" />}
      </div>
    );
  }

  if (!story) return <Missing href={home} label={trip ? "trip" : "story"} />;

  if (tab === "spots") {
    const find = story.spots.find((item) => item.id === itemId);
    if (!find) return <Missing href={back} label="find" />;
    const details = [
      find.duration ? ["Duration", find.duration] : null,
      find.cost ? ["Cost", formatInr(Number(find.cost))] : null,
      find.difficulty ? ["Difficulty", find.difficulty] : null,
      find.season ? ["Season", find.season] : null,
      find.ageGroup ? ["Age group", find.ageGroup] : null,
    ].filter((item): item is [string, string] => item !== null);
    return (
      <article className="h-full overflow-y-auto pb-10">
        <ViewHeader href={back} editHref={`${home}/${story.id}/spots/${find.id}/edit`} />
        <Gallery images={find.images} />
        <div className="grid gap-3 px-5 pt-4">
          <p className="text-sm text-muted-foreground">
            {categoryName(find.category)}
            {find.subcategory ? ` · ${find.subcategory}` : ""}
          </p>
          <h2 className="font-display text-3xl">{find.title}</h2>
          <p className="text-[15px] leading-6">{find.summary}</p>
          {find.tips ? (
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <p className="text-sm font-medium">Tips</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{find.tips}</p>
            </div>
          ) : null}
          {find.placeName ? (
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary" />
              {find.placeName}
            </p>
          ) : null}
        </div>
        {find.lat != null && find.lng != null ? (
          <div className="mx-5 mt-4 overflow-hidden rounded-3xl">
            <PinMap lat={find.lat} lng={find.lng} label={find.title} />
          </div>
        ) : null}
        {details.length > 0 ? (
          <dl className="mx-5 mt-5 grid grid-cols-2 gap-3">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-secondary px-3 py-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {find.affiliateUrl || find.referenceUrl ? (
          <div className="mx-5 mt-5 grid gap-2">
            {find.affiliateUrl ? (
              <a
                href={find.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                {find.category === "stay" ? "Reserve here" : "Book here"}
              </a>
            ) : null}
            {find.referenceUrl ? (
              <a
                href={find.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium"
              >
                <ExternalLink className="size-4" />
                {linkLabel(find.referenceUrl)}
              </a>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  if (tab === "plans") {
    const plan = story.plans.find((item) => item.id === itemId);
    if (!plan) return <Missing href={back} label="plan" />;
    const username = readCookie("th_username") || "you";
    const displayName = decodeURIComponent(readCookie("th_name") || "You");
    const publicStory = deskStoryAsPublic(story, { username, displayName });
    const itinerary = deskPlanAsPublic(plan);
    return (
      <ItineraryView
        story={publicStory}
        itinerary={itinerary}
        traveler={false}
        library={emptyLibrary}
        editHref={`${home}/${story.id}/plans/${plan.id}/edit`}
        backHref={back}
        backLabel={trip ? "Trip" : "Story"}
      />
    );
  }

  const blog = story.blogs.find((item) => item.id === itemId);
  if (!blog) return <Missing href={back} label="blog" />;
  return (
    <article className="h-full overflow-y-auto pb-10">
      <ViewHeader href={back} editHref={`${home}/${story.id}/blogs/${blog.id}/edit`} />
      <div className="relative mx-5 mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
        <Cover src={blog.coverUrl || "/blog-thumb.svg"} />
      </div>
      <h2 className="mt-4 px-5 font-display text-3xl">{blog.title}</h2>
      <div
        className="blog-view mt-4 px-5 text-[15px] leading-7"
        dangerouslySetInnerHTML={{ __html: blogMarkup(blog.body) }}
      />
    </article>
  );
}

function ViewHeader({ href, editHref }: { href: string; editHref: string }) {
  return (
    <header className="relative flex items-center justify-center px-5 pt-6">
      <BackLink href={href} className="absolute left-5" />
      <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-12 w-fit" />
      <Link
        href={editHref}
        aria-label="Edit"
        title="Edit"
        className="absolute right-5 inline-flex size-11 items-center justify-center rounded-full bg-secondary text-foreground"
      >
        <Pencil className="size-4" />
      </Link>
    </header>
  );
}

function Missing({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-5 pt-6">
      <BackLink href={href} />
      <p className="pt-6 text-sm text-muted-foreground">That {label} is not in this story.</p>
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className="relative mx-5 mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
        <Cover src={images[0]} sizes="(max-width: 768px) 100vw, 672px" />
      </div>
    );
  }
  return (
    <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5">
      {images.map((src, index) => (
        <div
          key={`${index}-${src.slice(0, 24)}`}
          className="relative aspect-[4/3] w-full min-w-full shrink-0 snap-center overflow-hidden rounded-3xl bg-secondary"
        >
          <Cover src={src} sizes="(max-width: 768px) 100vw, 672px" />
        </div>
      ))}
    </div>
  );
}

function Cover({ src, sizes = "360px" }: { src: string; sizes?: string }) {
  if (!src) return null;
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes={sizes} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-full object-cover" />;
}

function linkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Official site";
  }
}
