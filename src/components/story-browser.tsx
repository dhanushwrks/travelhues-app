"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LoginPrompt } from "@/components/login-prompt";
import { SpotSheet } from "@/components/spot-sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { MarkControls } from "@/components/mark-controls";
import { formatSpotMeta } from "@/lib/format";
import { markState, type Library } from "@/lib/marks";
import { itineraryHref, blogHref, spotTypes, type Spot, type SpotType, type Story } from "@/lib/types";

type StorySection = "spots" | "itinerary" | "blogs";

export function StoryBrowser({
  story,
  traveler,
  library,
  initialSpot = "",
  initialTab = "spots",
  guest = false,
}: {
  story: Story;
  traveler: boolean;
  library: Library;
  initialSpot?: string;
  initialTab?: StorySection;
  guest?: boolean;
}) {
  const [tab, setTab] = useState<StorySection>(initialSpot && !guest ? "spots" : initialTab);
  const [filter, setFilter] = useState<SpotType | "all">("all");
  const [openId, setOpenId] = useState<string | null>(guest ? null : initialSpot || null);
  const [loginOpen, setLoginOpen] = useState(false);
  const finds =
    filter === "all"
      ? story.spots
      : story.spots.filter((spot) => spot.type === filter);
  const openSpot = story.spots.find((spot) => spot.id === openId) ?? null;
  const blogs = story.blogs ?? [];

  function askLogin() {
    setLoginOpen(true);
  }

  return (
    <>
      <div className="mt-5 flex border-b border-border">
        <SectionTab label="Finds" count={story.spots.length} pressed={tab === "spots"} onClick={() => setTab("spots")} />
        <SectionTab
          label="Plans"
          count={story.itineraries.length}
          pressed={tab === "itinerary"}
          onClick={() => setTab("itinerary")}
        />
        <SectionTab label="Blogs" count={blogs.length} pressed={tab === "blogs"} onClick={() => setTab("blogs")} />
      </div>
      {tab === "spots" ? (
        <>
          <div className="flex gap-2 overflow-x-auto px-5 py-4">
            <FilterChip label="All" pressed={filter === "all"} onClick={() => setFilter("all")} />
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
          {finds.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No finds in this category.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 px-5 pb-10 lg:grid-cols-3">
              {finds.map((spot) => (
                <li key={spot.id}>
                  <SpotCard
                    spot={spot}
                    onOpen={() => {
                      if (guest) askLogin();
                      else setOpenId(spot.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
      {tab === "itinerary" ? (
        <section className="px-5 pt-5 pb-10">
          {story.itineraries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No itineraries in this story yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {story.itineraries.map((itinerary) => {
                const state = markState(library, "itinerary", story.slug, itinerary.slug);
                const card = (
                  <>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={itinerary.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="space-y-1 px-3 pt-3">
                      <p className="line-clamp-2 text-sm font-medium">{itinerary.title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {itinerary.days.length} {itinerary.days.length === 1 ? "day" : "days"}
                      </p>
                    </div>
                  </>
                );
                return (
                  <li key={itinerary.slug} className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                    {guest ? (
                      <button type="button" className="block w-full text-left" onClick={askLogin}>
                        {card}
                      </button>
                    ) : (
                      <Link href={itineraryHref(story, itinerary.slug)} className="block">
                        {card}
                      </Link>
                    )}
                    {guest ? null : (
                      <div className="px-3 pt-2 pb-3">
                        <MarkControls
                          traveler={traveler}
                          storySlug={story.slug}
                          kind="itinerary"
                          itinerarySlug={itinerary.slug}
                          liked={state.liked}
                          saved={state.saved}
                          likes={state.likes}
                        />
                      </div>
                    )}
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
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {blogs.map((blog) => {
                const card = (
                  <>
                    <span className="relative block aspect-[4/3] bg-muted">
                      {blog.coverUrl?.includes("images.unsplash.com") ? (
                        <Image
                          src={blog.coverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={blog.coverUrl || "/blog-thumb.svg"} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="block px-3 py-3">
                      <p className="line-clamp-2 text-sm font-medium">{blog.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {plainText(blog.body)}
                      </p>
                    </span>
                  </>
                );
                return (
                  <li key={blog.slug}>
                    {guest ? (
                      <button
                        type="button"
                        className="block w-full overflow-hidden rounded-2xl bg-white text-left ring-1 ring-border"
                        onClick={askLogin}
                      >
                        {card}
                      </button>
                    ) : (
                      <Link
                        href={blogHref(story, blog.slug)}
                        className="block overflow-hidden rounded-2xl bg-white ring-1 ring-border"
                      >
                        {card}
                      </Link>
                    )}
                  </li>
                );
              })}
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
      <LoginPrompt
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="Sign in to open this"
        body="Sign in to open finds, plans, and blogs inside a story."
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

function SpotCard({ spot, onOpen }: { spot: Spot; onOpen: () => void }) {
  const meta = spotTypeMeta[spot.type];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full overflow-hidden rounded-2xl bg-white text-left ring-1 ring-border"
    >
      <span className="relative block aspect-[4/3] bg-muted">
        <Image
          src={spot.images[0]}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 50vw, 33vw"
        />
      </span>
      <span className="block space-y-1 px-3 py-3">
        <span className={`flex items-center gap-1 text-xs font-medium ${meta.ink}`}>
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{meta.label}</span>
        </span>
        <span className="line-clamp-2 block text-sm font-medium">{spot.title}</span>
        <span className="line-clamp-2 block text-xs leading-5 text-muted-foreground">
          {formatSpotMeta(spot)}
        </span>
      </span>
    </button>
  );
}
