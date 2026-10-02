"use client";

import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { PostMediaPreview } from "@/components/post-media-preview";
import { StreamingVideo } from "@/components/streaming-video";
import { mediaUrl } from "@/lib/api";
import { resolvePlaybackSrc } from "@/lib/video-stream";
import { readCookie } from "@/lib/browser-session";
import {
  addPostComment,
  postBoard,
  postsServerSnapshot,
  postsSnapshot,
  subscribeStudio,
  type MediaPost,
  type PostMedia,
} from "@/lib/mock/studio";

export function PostView({ id, name }: { id: string; name: string }) {
  const posts = useSyncExternalStore(subscribeStudio, postsSnapshot, postsServerSnapshot);
  const board = useSyncExternalStore(subscribeStudio, () => postBoard(id), () => postBoard(id));
  const post = posts.find((item) => item.id === id) ?? null;
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  if (!post) {
    return (
      <div className="px-5 pt-8">
        <Link href="/storefront" className="text-sm font-medium">
          Home
        </Link>
        <p className="pt-6 text-sm text-muted-foreground">This post is gone.</p>
      </div>
    );
  }

  const frames = postFrames(post);

  async function share() {
    const url = window.location.href;
    setNotice("");
    const data: ShareData = { title: "Travelhues", text: post?.caption, url };
    const canTryShare =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(data));
    if (canTryShare) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name: string }).name === "AbortError"
        ) {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied");
    } catch {
      setNotice(url);
    }
  }

  function sendComment(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const author = decodeURIComponent(readCookie("th_name") || "") || name || "You";
    addPostComment(id, author, body);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto lg:flex-row">
      <section className="bg-black lg:flex lg:w-1/2 lg:items-center">
        <Carousel frames={frames} />
      </section>
      <section className="flex min-h-0 flex-1 flex-col px-5 pt-4 pb-8 lg:overflow-y-auto lg:px-8 lg:pt-6">
        <Link href="/storefront" className="text-sm font-medium">
          Home
        </Link>
        <p className="mt-4 text-[15px] leading-6">{post.caption}</p>
        <div className="mt-4 flex items-center gap-2">
          <span
            className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium"
            aria-label={`${board.likes} likes`}
          >
            <Heart className="size-4" />
            <span>{board.likes}</span>
          </span>
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium">
            <MessageCircle className="size-4" />
            {board.comments.length}
          </span>
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>
        {notice ? <p className="mt-2 text-sm text-muted-foreground">{notice}</p> : null}
        <h2 className="mt-6 text-sm font-medium">Comments</h2>
        {board.comments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {board.comments.map((comment) => (
              <li key={comment.id}>
                <p className="text-sm font-medium">{comment.author}</p>
                <p className="text-sm leading-6">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={sendComment} className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment"
            aria-label="Add a comment"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </section>
    </div>
  );
}

function Carousel({ frames }: { frames: PostMedia[] }) {
  const [index, setIndex] = useState(0);

  function onScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative w-full">
      <div onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto">
        {frames.map((frame, frameIndex) => (
          <div key={`${frame.imageUrl}-${frame.videoUrl}-${frameIndex}`} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-black">
            <Frame frame={frame} active={frameIndex === index} />
          </div>
        ))}
      </div>
      {frames.length > 1 ? (
        <p className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2 py-1 text-xs text-white">
          {index + 1} / {frames.length}
        </p>
      ) : null}
    </div>
  );
}

function Frame({ frame, active }: { frame: PostMedia; active: boolean }) {
  if (frame.kind === "video" && frame.videoUrl) {
    const src = resolvePlaybackSrc(frame.videoUrl, frame.streamUrl);
    return (
      <StreamingVideo
        src={src}
        poster={frame.imageUrl ? mediaUrl(frame.imageUrl) : undefined}
        controls
        playsInline
        shouldLoad={active}
        shouldPlay={false}
        className="size-full object-cover"
      />
    );
  }
  if (!frame.imageUrl) return null;
  return <PostMediaPreview imageUrl={frame.imageUrl} />;
}

function postFrames(post: MediaPost): PostMedia[] {
  if (post.media && post.media.length > 0) return post.media;
  return [
    {
      kind: post.kind === "photo" ? "photo" : "video",
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
    },
  ];
}
