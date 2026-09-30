"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PageLoader } from "@/components/loader";
import { countryFlag, countryName } from "@/lib/countries";
import { blogExcerpt, categoryName, type StoryTab } from "@/lib/mock/studio";
import { useDesk } from "@/lib/studio-desk";

const categoryOrder = ["stay", "food", "sightseeing", "activity", "shop"];
const blogThumb = "/blog-thumb.svg";

const tabs: { id: StoryTab; label: string }[] = [
  { id: "spots", label: "Spots" },
  { id: "plans", label: "Plans" },
  { id: "blogs", label: "Blogs" },
];

export function StoryDesk({ storyId, initialTab }: { storyId: string; initialTab: StoryTab }) {
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const [tab, setTab] = useState<StoryTab>(initialTab);
  const [spotFilter, setSpotFilter] = useState("all");

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <Link href="/studio" className="text-sm text-primary">
          Studio
        </Link>
        {status === "error" ? <p className="pt-6 text-sm text-primary">{problem}</p> : <PageLoader label="Loading the story" />}
      </div>
    );
  }

  if (!story) {
    return (
      <div className="px-5 pt-6">
        <Link href="/studio" className="text-sm text-primary">
          Studio
        </Link>
        <p className="pt-6 text-sm text-muted-foreground">That story is not on this desk.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-10">
      <div className="flex items-center gap-3 px-5 pt-5">
        <Link href="/studio" className="text-sm font-medium" aria-label="Studio">
          ←
        </Link>
        <h1 className="truncate text-lg font-medium">{story.title}</h1>
      </div>
      <div className="relative mx-5 mt-4 aspect-[16/9] overflow-hidden rounded-3xl bg-secondary">
        <Cover src={story.coverUrl} />
      </div>
      {story.videoUrl ? (
        <video src={story.videoUrl} controls playsInline className="mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-3xl bg-black" />
      ) : null}
      <div className="px-5 pt-4">
        <h2 className="font-display text-3xl">{story.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {countryFlag(story.country)} {countryName(story.country)}
        </p>
        <p className="mt-3 text-[15px] leading-6">{story.about}</p>
        <dl className="mt-4 flex gap-6 text-sm">
          <Count value={story.spots.length} label={story.spots.length === 1 ? "spot" : "spots"} />
          <Count value={story.plans.length} label={story.plans.length === 1 ? "plan" : "plans"} />
          <Count value={story.blogs.length} label={story.blogs.length === 1 ? "blog" : "blogs"} />
        </dl>
      </div>
      <div className="mt-5 grid grid-cols-3 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`h-11 text-sm font-medium ${
              tab === item.id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "spots" ? (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4">
          <FilterChip label="All" pressed={spotFilter === "all"} onClick={() => setSpotFilter("all")} />
          {spotCategories(story.spots).map((category) => (
            <FilterChip
              key={category}
              label={categoryName(category)}
              pressed={spotFilter === category}
              onClick={() => setSpotFilter(category)}
            />
          ))}
        </div>
      ) : null}
      <ul className="grid grid-cols-2 items-stretch gap-3 px-5 pt-4 lg:grid-cols-3">
        <li className="flex">
          <Link
            href={`/studio/${story.id}/${tab}/new`}
            className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-dashed border-foreground/25"
          >
            <span className="grid aspect-[4/3] place-items-center px-4 text-center">
              <span>
                <span className="block text-sm font-medium">{addLabel[tab]}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{addHint[tab]}</span>
              </span>
            </span>
            <span className="block flex-1 px-3 py-3" aria-hidden>
              <span className="block text-sm font-medium opacity-0">Title</span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 opacity-0">Detail</span>
            </span>
          </Link>
        </li>
        {tab === "spots"
          ? story.spots
              .filter((spot) => spotFilter === "all" || spot.category === spotFilter)
              .map((spot) => (
              <li key={spot.id} className="flex">
                <Link href={`/studio/${story.id}/spots/${spot.id}`} className="flex h-full w-full">
                  <Card imageUrl={spot.images[0] ?? ""} title={spot.title} detail={spot.summary} archived={spot.archived} />
                </Link>
              </li>
            ))
          : null}
        {tab === "plans"
          ? story.plans.map((plan) => (
              <li key={plan.id} className="flex">
                <Link href={`/studio/${story.id}/plans/${plan.id}`} className="flex h-full w-full">
                  <Card
                    imageUrl={plan.images[0] ?? story.coverUrl}
                    title={plan.title}
                    detail={`${plan.days.length} ${plan.days.length === 1 ? "day" : "days"}`}
                    archived={plan.archived}
                  />
                </Link>
              </li>
            ))
          : null}
        {tab === "blogs"
          ? story.blogs.map((blog) => (
              <li key={blog.id} className="flex">
                <Link href={`/studio/${story.id}/blogs/${blog.id}`} className="flex h-full w-full">
                  <Card imageUrl={blog.coverUrl || blogThumb} title={blog.title} detail={blogExcerpt(blog.body)} archived={blog.archived} />
                </Link>
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}

const addLabel: Record<StoryTab, string> = {
  spots: "Add a spot",
  plans: "Add a plan",
  blogs: "Add a blog",
};

const addHint: Record<StoryTab, string> = {
  spots: "A place to stay, eat, or see.",
  plans: "The days, in order.",
  blogs: "A note from the trip.",
};

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="font-display text-xl">{value}</dt>
      <dd className="text-muted-foreground">{label}</dd>
    </div>
  );
}

function spotCategories(spots: { category: string }[]) {
  const present = new Set(spots.map((spot) => spot.category));
  const known = categoryOrder.filter((category) => present.has(category));
  const extra = [...present].filter((category) => !categoryOrder.includes(category)).sort();
  return [...known, ...extra];
}

function FilterChip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-3.5 text-sm ${
        pressed ? "bg-foreground text-background" : "bg-secondary text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Card({
  imageUrl,
  title,
  detail,
  archived = false,
}: {
  imageUrl: string;
  title: string;
  detail: string;
  archived?: boolean;
}) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-secondary">
      <span className="relative block aspect-[4/3] bg-muted">
        <Cover src={imageUrl} />
        {archived ? (
          <span className="absolute top-2 left-2 rounded-full bg-foreground px-2 py-1 text-[11px] font-medium text-background">
            Archived
          </span>
        ) : null}
      </span>
      <span className="block flex-1 px-3 py-3">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</span>
      </span>
    </article>
  );
}

function Cover({ src }: { src: string }) {
  if (!src) return null;
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="200px" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-full object-cover" />;
}
