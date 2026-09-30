"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MapPin, Route, Share2, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { BackLink } from "@/components/back-link";
import { ProfileMast } from "@/components/profile-mast";
import { SocialLinks } from "@/components/social-links";
import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Glimpse } from "@/lib/glimpse";
import { storyLikeCount, type Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";
import { storyHref, type Story } from "@/lib/types";

const worldCountries = 197;

type Shelf = "posts" | "shorts" | "stories";

export function Storefront({
  person,
  shorts,
  library,
}: {
  person: Person;
  shorts: Glimpse[];
  library: Library;
}) {
  const [shelf, setShelf] = useState<Shelf>("stories");
  const traveled = [...new Set(person.countriesTraveled.map((code) => code.toUpperCase()))].filter((code) =>
    /^[A-Z]{2}$/.test(code),
  );

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center gap-2 px-5 pt-5">
        <BackLink href="/" />
        <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
        <h1 className="text-lg font-medium">Storefront</h1>
      </header>
      <ProfileMast
        className="mx-4"
        name={person.displayName}
        introVideoUrl={person.introVideoUrl}
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
      {shelf === "stories" ? <StoryShelf stories={person.stories} library={library} /> : null}
    </div>
  );
}

function StoryShelf({ stories, library }: { stories: Story[]; library: Library }) {
  if (stories.length === 0) {
    return <p className="px-5 pt-8 text-sm text-muted-foreground">No stories yet.</p>;
  }

  return (
    <ul className="grid gap-6 px-5 pt-6 md:grid-cols-2">
      {stories.map((story) => {
        const spots = story.spots.filter((spot) => !spot.archived).length;
        const itineraries = story.itineraries.filter((plan) => !plan.archived).length;
        const likes = storyLikeCount(library, story.slug);
        return (
          <li key={story.slug} className="overflow-hidden rounded-3xl bg-secondary">
            <Link href={storyHref(story)} className="block">
              <span className="relative block aspect-[16/9] bg-muted">
                <Cover src={story.coverUrl} />
              </span>
              <span className="block px-4 pt-3">
                <span className="block font-display text-2xl">{story.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {countryFlag(story.destination.country)} {countryName(story.destination.country)}
                </span>
              </span>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-4 text-sm text-muted-foreground">
                <Count icon={MapPin} value={spots} label="spots" />
                <Count icon={Route} value={itineraries} label="itineraries" />
                <Count icon={Heart} value={likes} label="likes" />
                <Count icon={Share2} value={0} label="shares" />
                <Count icon={Bookmark} value={0} label="saves" />
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Count({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value} ${label}`}>
      <Icon className="size-4 text-primary" aria-hidden />
      <span className="font-medium text-foreground">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
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
