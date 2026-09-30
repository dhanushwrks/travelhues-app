"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, MapPin, Pencil } from "lucide-react";

import { Loader, PageLoader } from "@/components/loader";
import { formatInr } from "@/lib/format";
import { blogMarkup, categoryName, type StoryTab } from "@/lib/mock/studio";
import { useDesk, useDeskHome } from "@/lib/studio-desk";

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
  const trip = home === "/trips";
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const back = `${home}/${storyId}?tab=${tab}`;

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <Link href={home} className="text-sm font-medium">
          ←
        </Link>
        {status === "error" ? <p className="pt-6 text-sm text-primary">{problem}</p> : <PageLoader label="Loading the story" />}
      </div>
    );
  }

  if (!story) return <Missing href={home} label={trip ? "trip" : "story"} />;

  if (tab === "spots") {
    const spot = story.spots.find((item) => item.id === itemId);
    if (!spot) return <Missing href={back} label="spot" />;
    const details = [
      spot.duration ? ["Duration", spot.duration] : null,
      spot.cost ? ["Cost", formatInr(Number(spot.cost))] : null,
      spot.difficulty ? ["Difficulty", spot.difficulty] : null,
      spot.season ? ["Season", spot.season] : null,
      spot.ageGroup ? ["Age group", spot.ageGroup] : null,
    ].filter((item): item is [string, string] => item !== null);
    return (
      <article className="h-full overflow-y-auto pb-10">
        <ViewHeader href={back} editHref={`${home}/${story.id}/spots/${spot.id}/edit`} />
        <Gallery images={spot.images} />
        <div className="grid gap-3 px-5 pt-4">
          <p className="text-sm text-muted-foreground">
            {categoryName(spot.category)}
            {spot.subcategory ? ` · ${spot.subcategory}` : ""}
          </p>
          <h2 className="font-display text-3xl">{spot.title}</h2>
          <p className="text-[15px] leading-6">{spot.summary}</p>
          {spot.tips ? (
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <p className="text-sm font-medium">Tips</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{spot.tips}</p>
            </div>
          ) : null}
          {spot.placeName ? (
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary" />
              {spot.placeName}
            </p>
          ) : null}
        </div>
        {spot.lat != null && spot.lng != null ? (
          <div className="mx-5 mt-4 overflow-hidden rounded-3xl">
            <PinMap lat={spot.lat} lng={spot.lng} label={spot.title} />
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
        {spot.affiliateUrl || spot.referenceUrl ? (
          <div className="grid gap-2 px-5 pt-5 text-sm">
            {spot.affiliateUrl ? (
              <a href={spot.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                Booking link
              </a>
            ) : null}
            {spot.referenceUrl ? (
              <a href={spot.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                Reference
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
    return (
      <article className="h-full overflow-y-auto pb-10">
        <ViewHeader href={back} editHref={`${home}/${story.id}/plans/${plan.id}/edit`} />
        <Gallery images={plan.images} />
        <div className="grid gap-3 px-5 pt-4">
          <p className="text-sm text-muted-foreground">
            {plan.days.length} {plan.days.length === 1 ? "day" : "days"}
          </p>
          <h2 className="font-display text-3xl">{plan.title}</h2>
          <p className="text-[15px] leading-6">{plan.summary}</p>
        </div>
        <ol className="grid gap-6 px-5 pt-6">
          {plan.days.map((day, index) => (
            <li key={day.id}>
              <p className="text-sm text-muted-foreground">Day {index + 1}</p>
              <h3 className="mt-1 text-lg font-medium">{day.title || "Untitled day"}</h3>
              {day.blocks.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing on this day.</p>
              ) : (
                <ul className="mt-3 grid gap-3">
                  {day.blocks.map((block) => {
                    if (block.kind === "note") {
                      return (
                        <li key={block.id} className="rounded-2xl bg-secondary px-3 py-3 text-sm leading-6">
                          <p>{block.body}</p>
                          {block.minutes ? <p className="mt-1 text-muted-foreground">{block.minutes}</p> : null}
                        </li>
                      );
                    }
                    const spot = story.spots.find((item) => item.id === block.spotId);
                    if (!spot) {
                      return (
                        <li key={block.id} className="rounded-2xl bg-secondary px-3 py-3 text-sm text-muted-foreground">
                          This spot is no longer in the story.
                        </li>
                      );
                    }
                    return (
                      <li key={block.id}>
                        <Link href={`${home}/${story.id}/spots/${spot.id}`} className="flex gap-3 rounded-2xl bg-secondary p-2">
                          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                            <Cover src={spot.images[0] ?? ""} />
                          </span>
                          <span className="min-w-0 py-1">
                            <span className="block truncate text-sm font-medium">{spot.title}</span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {categoryName(spot.category)}
                              {spot.duration ? ` · ${spot.duration}` : ""}
                              {spot.cost ? ` · ${formatInr(Number(spot.cost))}` : ""}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </article>
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
      <Link href={href} aria-label="Back" className="absolute left-5 grid size-10 place-items-center rounded-full">
        <ChevronLeft className="size-5" />
      </Link>
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
      <Link href={href} className="text-sm font-medium">
        ←
      </Link>
      <p className="pt-6 text-sm text-muted-foreground">That {label} is not in this story.</p>
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-4 flex snap-x gap-3 overflow-x-auto px-5">
      {images.map((src, index) => (
        <div key={`${index}-${src.slice(0, 24)}`} className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-3xl bg-secondary">
          <Cover src={src} />
        </div>
      ))}
    </div>
  );
}

function Cover({ src }: { src: string }) {
  if (!src) return null;
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="360px" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-full object-cover" />;
}
