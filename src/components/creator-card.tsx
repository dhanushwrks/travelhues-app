"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Globe2, MapPin, Route, type LucideIcon } from "lucide-react";

import { LoginGateCard } from "@/components/login-prompt";
import { mediaUrl } from "@/lib/api";

export type CreatorCardData = {
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  blurb: string;
  stories: number;
  introVideoUrl?: string;
  countries?: number;
  spots?: number;
  itineraries?: number;
  blogs?: number;
};

export function CreatorCard({
  creator,
  guest = false,
  detailed = false,
}: {
  creator: CreatorCardData;
  guest?: boolean;
  detailed?: boolean;
}) {
  const hasIntro = Boolean(creator.introVideoUrl?.trim());
  const body = (
    <>
      <span className="relative block aspect-[16/10] bg-muted">
        {creator.coverUrl ? <Cover src={creator.coverUrl} /> : null}
      </span>
      <span className="grid gap-2 px-4 py-4 text-left">
        <span className="flex items-center gap-3">
          <span
            className={
              hasIntro
                ? "relative size-11 shrink-0 rounded-full bg-primary p-[2px]"
                : "relative size-11 shrink-0 rounded-full bg-secondary"
            }
          >
            <span className="relative block size-full overflow-hidden rounded-full bg-secondary">
              {creator.avatarUrl ? <Cover src={creator.avatarUrl} /> : null}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{creator.displayName}</span>
            <span className="block text-sm text-muted-foreground">
              {creator.stories} {creator.stories === 1 ? "story" : "stories"}
            </span>
          </span>
        </span>
        {creator.blurb ? (
          <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">{creator.blurb}</span>
        ) : null}
        {detailed ? (
          <>
            <span className="pt-1 text-sm text-muted-foreground">
              <Count
                icon={Globe2}
                value={creator.countries ?? 0}
                label={creator.countries === 1 ? "country" : "countries"}
              />
            </span>
            <span className="flex flex-nowrap items-center gap-x-1.5 overflow-hidden text-[13px] text-muted-foreground">
              <Count icon={MapPin} value={creator.spots ?? 0} label="Finds" named />
              <span aria-hidden>|</span>
              <Count icon={Route} value={creator.itineraries ?? 0} label="Plans" named />
              <span aria-hidden>|</span>
              <Count icon={BookOpen} value={creator.blogs ?? 0} label="Reads" named />
            </span>
          </>
        ) : null}
      </span>
    </>
  );

  if (guest) {
    return (
      <LoginGateCard
        className="block h-full w-full overflow-hidden rounded-3xl bg-card text-left ring-1 ring-border"
        label={creator.displayName}
        title="Sign in to view this creator"
        body="Sign in to open creator profiles, stories, and posts."
      >
        {body}
      </LoginGateCard>
    );
  }

  return (
    <Link href={`/u/${creator.username}`} className="block h-full overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      {body}
    </Link>
  );
}

function Count({
  icon: Icon,
  value,
  label,
  named = false,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  named?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={named ? `${label} ${value}` : `${value} ${label}`}>
      <Icon className="size-4 text-primary" aria-hidden />
      {named ? <span>{label}</span> : null}
      <span className="font-medium text-foreground">{value}</span>
      {named ? null : <span>{label}</span>}
    </span>
  );
}

function Cover({ src }: { src: string }) {
  const url = mediaUrl(src);
  if (url.includes("images.unsplash.com")) {
    return <Image src={url} alt="" fill className="object-cover" sizes="180px" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-full object-cover" />
  );
}
