"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import { mediaUrl } from "@/lib/api";

export function StoryHero({
  cover,
  videoUrl,
  portrait,
  name,
  username,
}: {
  cover: string;
  videoUrl: string;
  portrait: string;
  name: string;
  username: string;
}) {
  const [sound, setSound] = useState(false);
  const avatar = mediaUrl(portrait);

  return (
    <div className="relative mx-4 mt-4 pb-14">
      <div className="relative h-52 overflow-hidden rounded-[1.75rem] bg-secondary md:h-72">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={cover || undefined}
            className="size-full object-cover"
            autoPlay
            loop
            muted={!sound}
            playsInline
          />
        ) : cover ? (
          <Image
            src={cover}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 72rem, 100vw"
          />
        ) : null}
        <Link
          href="/"
          className="absolute top-3 left-3 inline-flex h-11 items-center gap-1 rounded-full bg-white/90 px-3 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="size-4" />
          Explore
        </Link>
        {videoUrl ? (
          <button
            type="button"
            aria-label={sound ? "Mute highlight" : "Play highlight with sound"}
            aria-pressed={sound}
            onClick={() => setSound((value) => !value)}
            className="absolute right-3 bottom-3 grid size-8 place-items-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border"
          >
            {sound ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        ) : null}
      </div>
      <div className="absolute bottom-0 left-4 z-10 flex items-end gap-3">
        <span className="relative block size-28 shrink-0 overflow-hidden rounded-full border-[5px] border-card bg-secondary">
          {avatar ? (
            <Portrait src={avatar} />
          ) : (
            <span className="grid size-full place-items-center font-display text-3xl">{name.slice(0, 1)}</span>
          )}
        </span>
        <Link href={`/u/${username}`} className="mb-2 inline-flex text-sm font-medium">
          @{username}
        </Link>
      </div>
    </div>
  );
}

function Portrait({ src }: { src: string }) {
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="112px" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
  );
}
