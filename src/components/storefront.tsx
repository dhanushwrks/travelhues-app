"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Glimpse } from "@/lib/glimpse";
import { blogExcerpt } from "@/lib/mock/studio";
import type { Person } from "@/lib/profile";
import { ProfileMast } from "@/components/profile-mast";
import { SocialLinks } from "@/components/social-links";
import { itineraryHref, blogHref, storyHref, type Story, type StoryBlog } from "@/lib/types";

const worldCountries = 197;

type Shelf = "posts" | "shorts" | "stories";
type StoryPiece = "spots" | "plans" | "blogs";

export function Storefront({
  person,
  shorts,
}: {
  person: Person;
  shorts: Glimpse[];
}) {
  const [shelf, setShelf] = useState<Shelf>("stories");
  const traveled = [...new Set(person.countriesTraveled.map((code) => code.toUpperCase()))].filter((code) =>
    /^[A-Z]{2}$/.test(code),
  );

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center gap-2 px-5 pt-5">
        <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
        <h1 className="text-lg font-medium">Storefront</h1>
      </header>
      <ProfileMast
        className="mx-4"
        name={person.displayName}
        cover={person.coverUrl ? <UserPhoto src={mediaUrl(person.coverUrl)} className="absolute inset-0 size-full object-cover" /> : null}
        avatar={person.avatarUrl ? <UserPhoto src={mediaUrl(person.avatarUrl)} className="absolute inset-0 size-full object-cover" /> : null}
      />
      <div className="px-5 pt-2">
        <h2 className="font-display text-3xl">{person.displayName}</h2>
        <p className="text-sm text-muted-foreground">@{person.username}</p>
        {person.headline ? <p className="mt-3 text-sm font-medium">{person.headline}</p> : null}
        {person.bio ? <p className="mt-2 text-[15px] leading-6">{person.bio}</p> : null}
        <section className="mt-5" aria-label="Countries traveled">
          <p className="font-display text-3xl">
            {traveled.length}
            <span className="text-muted-foreground">/{worldCountries}</span>
          </p>
          <p className="text-sm text-muted-foreground">Countries traveled</p>
          {traveled.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {traveled.map((code) => (
                <li key={code} title={countryName(code)} className="text-2xl leading-none">
                  <span aria-label={countryName(code)}>{countryFlag(code)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No countries marked yet.</p>
          )}
        </section>
        <SocialLinks links={person.socials} />
      </div>
      <div className="mt-8 flex border-b border-border px-5">
        <ShelfTab label="Posts" count={0} pressed={shelf === "posts"} onClick={() => setShelf("posts")} />
        <ShelfTab label="Shorts" count={shorts.length} pressed={shelf === "shorts"} onClick={() => setShelf("shorts")} />
        <ShelfTab
          label="Stories"
          count={person.stories.length}
          pressed={shelf === "stories"}
          onClick={() => setShelf("stories")}
        />
      </div>
      {shelf === "posts" ? (
        <p className="px-5 pt-8 text-sm text-muted-foreground">No posts yet.</p>
      ) : null}
      {shelf === "shorts" ? <ShortsGrid shorts={shorts} /> : null}
      {shelf === "stories" ? <StoryShelf stories={person.stories} /> : null}
    </div>
  );
}

function StoryShelf({ stories }: { stories: Story[] }) {
  const [open, setOpen] = useState(stories[0]?.slug ?? "");
  const [section, setSection] = useState<Record<string, StoryPiece>>({});

  if (stories.length === 0) {
    return <p className="px-5 pt-8 text-sm text-muted-foreground">No stories yet.</p>;
  }

  return (
    <ul className="grid gap-6 px-5 pt-6 md:grid-cols-2">
      {stories.map((story) => {
        const active = section[story.slug] ?? "spots";
        const expanded = open === story.slug;
        const spots = story.spots.filter((spot) => !spot.archived);
        const plans = story.itineraries.filter((plan) => !plan.archived);
        const blogs = (story.blogs ?? []).filter((blog) => !blog.archived);
        return (
          <li key={story.slug} className="overflow-hidden rounded-3xl bg-secondary">
            <button type="button" className="block w-full text-left" onClick={() => setOpen(expanded ? "" : story.slug)}>
              <span className="relative block aspect-[16/9] bg-muted">
                <Cover src={story.coverUrl} />
              </span>
              <span className="block px-4 pt-3">
                <span className="block font-display text-2xl">{story.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {countryFlag(story.destination.country)} {countryName(story.destination.country)}
                </span>
              </span>
            </button>
            <div className="mt-3 flex border-t border-border">
              <ShelfTab
                label="Spots"
                count={spots.length}
                pressed={expanded && active === "spots"}
                onClick={() => openSection(story.slug, "spots")}
              />
              <ShelfTab
                label="Plans"
                count={plans.length}
                pressed={expanded && active === "plans"}
                onClick={() => openSection(story.slug, "plans")}
              />
              <ShelfTab
                label="Blogs"
                count={blogs.length}
                pressed={expanded && active === "blogs"}
                onClick={() => openSection(story.slug, "blogs")}
              />
            </div>
            {expanded ? (
              <div className="px-4 py-4">
                {active === "spots" ? <SpotList story={story} spots={spots} /> : null}
                {active === "plans" ? <PlanList story={story} plans={plans} /> : null}
                {active === "blogs" ? <BlogList story={story} blogs={blogs} /> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  function openSection(slug: string, next: StoryPiece) {
    setOpen(slug);
    setSection((current) => ({ ...current, [slug]: next }));
  }
}

function SpotList({ story, spots }: { story: Story; spots: Story["spots"] }) {
  if (spots.length === 0) return <Empty label="No spots in this story yet." />;
  return (
    <ul className="grid gap-3">
      {spots.map((spot) => (
        <li key={spot.id}>
          <Link href={storyHref(story, spot.id)} className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Cover src={spot.images[0] ?? ""} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{spot.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{spot.address}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PlanList({ story, plans }: { story: Story; plans: Story["itineraries"] }) {
  if (plans.length === 0) return <Empty label="No plans in this story yet." />;
  return (
    <ul className="grid gap-3">
      {plans.map((plan) => (
        <li key={plan.slug}>
          <Link href={itineraryHref(story, plan.slug)} className="block">
            <span className="block text-sm font-medium">{plan.title}</span>
            <span className="block text-xs text-muted-foreground">
              {plan.days.length} {plan.days.length === 1 ? "day" : "days"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BlogList({ story, blogs }: { story: Story; blogs: StoryBlog[] }) {
  if (blogs.length === 0) return <Empty label="No blogs in this story yet." />;
  return (
    <ul className="grid gap-3">
      {blogs.map((blog) => (
        <li key={blog.slug}>
          <Link href={blogHref(story, blog.slug)} className="block">
            <span className="block text-sm font-medium">{blog.title}</span>
            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
              {blogExcerpt(blog.body, 100)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ShortsGrid({ shorts }: { shorts: Glimpse[] }) {
  if (shorts.length === 0) return <p className="px-5 pt-8 text-sm text-muted-foreground">No shorts yet.</p>;
  return (
    <ul className="grid grid-cols-3 gap-2 px-5 pt-6 md:grid-cols-4 lg:grid-cols-6">
      {shorts.map((short) => (
        <li key={short.id}>
          <Link href={`/shorts?start=${short.id}`} className="block">
            <span className="relative block aspect-[9/16] overflow-hidden rounded-2xl bg-foreground">
              {short.posterUrl ? (
                <UserPhoto src={mediaUrl(short.posterUrl)} className="size-full object-cover" />
              ) : (
                <span className="absolute inset-x-0 bottom-0 p-2 text-xs text-background">{short.caption}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ShelfTab({
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
      className={`h-11 flex-1 text-sm font-medium md:flex-none md:px-6 ${
        pressed ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      <span className="ml-1 text-muted-foreground">{count}</span>
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function Cover({ src }: { src: string }) {
  if (!src) return null;
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="430px" />;
  }
  return <UserPhoto src={mediaUrl(src)} className="size-full object-cover" />;
}

function UserPhoto({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}
