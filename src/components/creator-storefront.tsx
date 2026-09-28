"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import {
  postsServerSnapshot,
  postsSnapshot,
  storefrontBio,
  storiesServerSnapshot,
  storiesSnapshot,
  subscribeStudio,
} from "@/lib/mock/studio";

export function CreatorStorefront({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const [tab, setTab] = useState<"posts" | "glimpses">("posts");
  const posts = useSyncExternalStore(subscribeStudio, postsSnapshot, postsServerSnapshot);
  const stories = useSyncExternalStore(subscribeStudio, storiesSnapshot, storiesServerSnapshot);
  const storyCount = stories.length;

  const grid = posts.filter((post) => (tab === "glimpses" ? post.kind === "glimpse" : post.kind !== "glimpse"));
  const glimpseCount = posts.filter((post) => post.kind === "glimpse").length;
  const postCount = posts.length - glimpseCount;
  const initial = (name || username || "T").slice(0, 1);

  return (
    <div className="h-full overflow-y-auto pb-6">
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
          <Link href="/account" className="text-sm">
            Settings
          </Link>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-secondary font-display text-3xl">
            {initial}
          </span>
          <dl className="grid flex-1 grid-cols-3 text-center">
            <Count value={postCount} label="Posts" />
            <Count value={glimpseCount} label="Glimpses" />
            <Count value={storyCount} label="Stories" />
          </dl>
        </div>
        <h1 className="mt-4 font-display text-2xl">{name || username}</h1>
        <p className="text-sm text-muted-foreground">@{username}</p>
        <p className="mt-3 text-sm leading-6">{storefrontBio}</p>
        <Link
          href="/storefront/new"
          className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New post
        </Link>
      </header>
      <div className="mt-6 grid grid-cols-2 border-y border-border">
        <TabButton label="Posts" pressed={tab === "posts"} onClick={() => setTab("posts")} />
        <TabButton label="Glimpses" pressed={tab === "glimpses"} onClick={() => setTab("glimpses")} />
      </div>
      {grid.length === 0 ? (
        <p className="px-5 pt-8 text-sm text-muted-foreground">
          {tab === "glimpses" ? "No glimpses yet." : "No posts yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-px bg-border">
          {grid.map((post) => (
            <li key={post.id} className="bg-card">
              <figure className="relative aspect-square">
                {post.imageUrl.startsWith("data:") || post.imageUrl.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="size-full object-cover" />
                ) : post.imageUrl ? (
                  <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="144px" />
                ) : (
                  <video src={post.videoUrl} muted playsInline className="size-full object-cover" />
                )}
                {post.kind !== "photo" ? (
                  <figcaption className="absolute right-1.5 bottom-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
                    {post.kind === "glimpse" ? "Glimpse" : "Video"}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="font-display text-xl">{value}</dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function TabButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`h-11 text-sm font-medium ${pressed ? "text-foreground" : "text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}
