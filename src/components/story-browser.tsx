"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SpotSheet } from "@/components/spot-sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { MarkControls } from "@/components/mark-controls";
import { formatSpotMeta } from "@/lib/format";
import { markState, type Library } from "@/lib/marks";
import { itineraryHref, spotTypes, type Spot, type SpotType, type Story } from "@/lib/types";

type StorySection = "spots" | "itinerary" | "blogs";

export function StoryBrowser({
  story,
  traveler,
  library,
  initialSpot = "",
  initialTab = "spots",
}: {
  story: Story;
  traveler: boolean;
  library: Library;
  initialSpot?: string;
  initialTab?: StorySection;
}) {
  const [tab, setTab] = useState<StorySection>(initialSpot ? "spots" : initialTab);
  const [filter, setFilter] = useState<SpotType | "all">("all");
  const [openId, setOpenId] = useState<string | null>(initialSpot || null);
  const spots =
    filter === "all"
      ? story.spots
      : story.spots.filter((spot) => spot.type === filter);
  const openSpot = story.spots.find((spot) => spot.id === openId) ?? null;

  const blogs = story.blogs ?? [];

  return (
    <>
      <div className="mt-5 flex border-b border-border">
        <SectionTab label="Spots" count={story.spots.length} pressed={tab === "spots"} onClick={() => setTab("spots")} />
        <SectionTab
          label="Itinerary"
          count={story.itineraries.length}
          pressed={tab === "itinerary"}
          onClick={() => setTab("itinerary")}
        />
        <SectionTab label="Blogs" count={blogs.length} pressed={tab === "blogs"} onClick={() => setTab("blogs")} />
      </div>
      {tab === "spots" ? (
        <>
      <div className="flex gap-2 overflow-x-auto px-5 py-4">
        <FilterChip
          label="All"
          pressed={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {spotTypes.map((type) => (
          <FilterChip
            key={type}
            label={spotTypeMeta[type].label}
            pressed={filter === type}
            tone={spotTypeMeta[type].chip}
            onClick={() => setFilter(type)}
          />
        ))}
      </div>
      <ul className="divide-y divide-border px-5">
        {spots.map((spot) => (
          <li key={spot.id}>
            <SpotRow spot={spot} onOpen={() => setOpenId(spot.id)} />
          </li>
        ))}
      </ul>
      {spots.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No spots in this category.
        </p>
      ) : null}
        </>
      ) : null}
      {tab === "itinerary" ? (
      <section className="px-5 pt-5 pb-10">
        {story.itineraries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No itineraries in this story yet.</p>
        ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {story.itineraries.map((itinerary) => {
            const state = markState(library, "itinerary", story.slug, itinerary.slug);
            return (
            <li key={itinerary.slug} className="grid gap-2">
              <Link
                href={itineraryHref(story, itinerary.slug)}
                className="block overflow-hidden rounded-2xl bg-white ring-1 ring-border"
              >
                <div className="relative aspect-[2/1]">
                  <Image
                    src={itinerary.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="430px"
                  />
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="text-base font-medium">{itinerary.title}</p>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {itinerary.days.length} {itinerary.days.length === 1 ? "day" : "days"}
                  </p>
                </div>
              </Link>
              <MarkControls
                traveler={traveler}
                storySlug={story.slug}
                kind="itinerary"
                itinerarySlug={itinerary.slug}
                liked={state.liked}
                saved={state.saved}
                likes={state.likes}
              />
            </li>
            );
          })}
        </ul>
        )}
      </section>
      ) : null}
      {tab === "blogs" ? (
        <section className="px-5 pt-5 pb-10">
          {blogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blogs in this story yet.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {blogs.map((blog) => (
                <li key={blog.slug} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                  <span className="relative block aspect-[4/3] bg-muted">
                    {blog.coverUrl?.includes("images.unsplash.com") ? (
                      <Image src={blog.coverUrl} alt="" fill className="object-cover" sizes="430px" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={blog.coverUrl || "/blog-thumb.svg"} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="block px-4 py-3">
                    <p className="text-base font-medium">{blog.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{plainText(blog.body)}</p>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <SpotSheet
        spot={openSpot}
        open={openSpot !== null}
        storySlug={story.slug}
        traveler={traveler}
        liked={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).liked : false}
        saved={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).saved : false}
        likes={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).likes : 0}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}

function SectionTab({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-11 flex-1 text-sm font-medium md:flex-none md:px-6 ${pressed ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
    >
      {label}
      <span className="ml-1 text-muted-foreground">{count}</span>
    </button>
  );
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function FilterChip({
  label,
  pressed,
  onClick,
  tone,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-11 shrink-0 rounded-full px-4 text-sm font-medium ${
        pressed
          ? (tone ?? "bg-primary text-primary-foreground")
          : "bg-white text-foreground ring-1 ring-border"
      }`}
    >
      {label}
    </button>
  );
}

function SpotRow({ spot, onOpen }: { spot: Spot; onOpen: () => void }) {
  const meta = spotTypeMeta[spot.type];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 py-3 text-left"
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image src={spot.images[0]} alt="" fill className="object-cover" sizes="64px" />
      </span>
      <span className="min-w-0">
        <span className={`flex items-center gap-1.5 text-sm font-medium ${meta.ink}`}>
          <Icon className="size-4" />
          {meta.label}
        </span>
        <span className="mt-0.5 block text-base font-medium">{spot.title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {formatSpotMeta(spot)}
        </span>
      </span>
    </button>
  );
}
