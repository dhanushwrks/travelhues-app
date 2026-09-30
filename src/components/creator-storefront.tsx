"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { mediaUrl } from "@/lib/api";
import {
  postBoard,
  postsServerSnapshot,
  postsSnapshot,
  storefrontBio,
  subscribeStudio,
} from "@/lib/mock/studio";
import { useDesk } from "@/lib/studio-desk";

export function CreatorStorefront({
  name,
  username,
  avatarUrl = "",
}: {
  name: string;
  username: string;
  avatarUrl?: string;
}) {
  const [tab, setTab] = useState<"posts" | "glimpses">("posts");
  const posts = useSyncExternalStore(subscribeStudio, postsSnapshot, postsServerSnapshot);
  const { stories } = useDesk();
  const storyCount = stories.length;

  const grid = posts.filter((post) => (tab === "glimpses" ? post.kind === "glimpse" : post.kind !== "glimpse"));
  const glimpseCount = posts.filter((post) => post.kind === "glimpse").length;
  const postCount = posts.length - glimpseCount;
  const initial = (name || username || "T").slice(0, 1);
  const avatar = mediaUrl(avatarUrl);

  return (
    <div className="h-full overflow-y-auto pb-24">
      <header className="px-5 pt-6">
        <Image
          src="/travelhues-logo.png"
          alt="Travelhues"
          width={374}
          height={102}
          priority
          className="h-10 w-auto"
        />
        <div className="mt-5 flex items-center gap-4">
          <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-display text-3xl">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <dl className="grid flex-1 grid-cols-3 text-center">
            <Count value={postCount} label="Posts" />
            <Count value={glimpseCount} label="Shorts" />
            <Count value={storyCount} label="Stories" />
          </dl>
        </div>
        <h1 className="mt-4 font-display text-2xl">{name || username}</h1>
        <p className="text-sm text-muted-foreground">@{username}</p>
        <p className="mt-3 text-sm leading-6">{storefrontBio}</p>
      </header>
      <div className="mt-6 grid grid-cols-2 border-y border-border">
        <TabButton label="Posts" pressed={tab === "posts"} onClick={() => setTab("posts")} />
        <TabButton label="Shorts" pressed={tab === "glimpses"} onClick={() => setTab("glimpses")} />
      </div>
      {grid.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          {tab === "glimpses" ? "No shorts yet." : "No posts yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-px bg-border md:grid-cols-4 lg:grid-cols-6">
          {grid.map((post) => {
            const likes = postBoard(post.id).likes;
            const saves = 0;
            return (
              <li key={post.id} className="bg-card">
                <Link
                  href={`/storefront/posts/${post.id}`}
                  className="group block focus-visible:outline-none"
                  aria-label={`${likes} likes, ${saves} saves`}
                >
                  <figure className="relative aspect-square">
                    {post.imageUrl.startsWith("data:") || post.imageUrl.startsWith("blob:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt="" className="size-full object-cover" />
                    ) : post.imageUrl ? (
                      <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="144px" />
                    ) : (
                      <video src={post.videoUrl} muted playsInline className="size-full object-cover" />
                    )}
                    <span
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-4 bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                      aria-hidden
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Heart className="size-4 fill-current" />
                        {likes}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bookmark className="size-4 fill-current" />
                        {saves}
                      </span>
                    </span>
                    {post.media && post.media.length > 1 ? (
                      <figcaption className="absolute right-1.5 bottom-1.5 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
                        {post.media.length}
                      </figcaption>
                    ) : post.kind !== "photo" ? (
                      <figcaption className="absolute right-1.5 bottom-1.5 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
                        {post.kind === "glimpse" ? "Short" : "Video"}
                      </figcaption>
                    ) : null}
                  </figure>
                </Link>
              </li>
            );
          })}
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
