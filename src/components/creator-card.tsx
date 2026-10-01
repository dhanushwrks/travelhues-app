"use client";

import Image from "next/image";
import Link from "next/link";

import { LoginGateCard } from "@/components/login-prompt";
import { mediaUrl } from "@/lib/api";

export type CreatorCardData = {
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  blurb: string;
  stories: number;
};

export function CreatorCard({
  creator,
  guest = false,
}: {
  creator: CreatorCardData;
  guest?: boolean;
}) {
  const body = (
    <>
      <span className="relative block aspect-[16/10] bg-muted">
        {creator.coverUrl ? <Cover src={creator.coverUrl} /> : null}
      </span>
      <span className="grid gap-2 px-4 py-4 text-left">
        <span className="flex items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-secondary">
            {creator.avatarUrl ? <Cover src={creator.avatarUrl} /> : null}
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
      </span>
    </>
  );

  if (guest) {
    return (
      <LoginGateCard
        className="block w-full overflow-hidden rounded-3xl bg-card text-left ring-1 ring-border"
        label={creator.displayName}
        title="Sign in to view this creator"
        body="Sign in to open creator profiles, stories, and posts."
      >
        {body}
      </LoginGateCard>
    );
  }

  return (
    <Link href={`/u/${creator.username}`} className="block overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      {body}
    </Link>
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
