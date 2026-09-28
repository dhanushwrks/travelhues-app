"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiBase, apiMessage } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { linkHref, type Glimpse } from "@/lib/glimpse";

export function GlimpsePlayer({
  initial,
  startId,
}: {
  initial: Glimpse[];
  startId: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [glimpses, setGlimpses] = useState(initial);
  const [active, setActive] = useState(() => {
    const index = initial.findIndex((glimpse) => glimpse.id === startId);
    return index >= 0 ? index : 0;
  });
  const [sound, setSound] = useState(false);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { root, threshold: 0.75 },
    );
    for (const child of root.children) observer.observe(child);
    const start = root.querySelector<HTMLElement>(`[data-id="${CSS.escape(startId)}"]`);
    start?.scrollIntoView();
    return () => observer.disconnect();
  }, [startId]);

  useEffect(() => {
    const videos = scroller.current?.querySelectorAll("video");
    if (!videos) return;
    videos.forEach((video, index) => {
      video.muted = !sound;
      if (index === active) {
        void video.play().catch(() => undefined);
        return;
      }
      video.pause();
    });
  }, [active, sound]);

  async function toggleLike(glimpse: Glimpse) {
    const response = await fetch(`${apiBase}/glimpses/${glimpse.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${readCookie("th_access")}` },
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { liked: boolean; likes: number };
    setGlimpses((current) =>
      current.map((item) =>
        item.id === glimpse.id ? { ...item, liked: payload.liked, likes: payload.likes } : item,
      ),
    );
  }

  async function sendComment(glimpseId: string) {
    const body = draft.trim();
    if (!body) return;
    setError("");
    const response = await fetch(`${apiBase}/glimpses/${glimpseId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      setError(await apiMessage(response));
      return;
    }
    const comment = (await response.json()) as Glimpse["comments"][number];
    setDraft("");
    setGlimpses((current) =>
      current.map((item) =>
        item.id === glimpseId ? { ...item, comments: [...item.comments, comment] } : item,
      ),
    );
  }

  if (glimpses.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div className="grid gap-3">
          <p>No glimpses yet.</p>
          <Link href="/" className="text-sm text-primary">
            Back to explore
          </Link>
        </div>
      </div>
    );
  }

  const open = glimpses.find((glimpse) => glimpse.id === commentsFor) ?? null;

  return (
    <div className="relative h-full bg-foreground text-background">
      <Link href="/" className="absolute top-4 left-4 z-10 text-sm">
        Explore
      </Link>
      <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-auto">
        {glimpses.map((glimpse, index) => (
          <article
            key={glimpse.id}
            data-index={index}
            data-id={glimpse.id}
            className="relative h-full snap-start"
          >
            <video
              src={glimpse.videoUrl}
              poster={glimpse.posterUrl || undefined}
              className="size-full object-cover"
              playsInline
              loop
              muted
              preload={index === active ? "auto" : "metadata"}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute right-3 bottom-24 grid justify-items-center gap-4 text-center">
              <button type="button" className="text-xs" onClick={() => setSound((value) => !value)}>
                {sound ? "Sound on" : "Sound off"}
              </button>
              <button type="button" className="grid text-xs" onClick={() => void toggleLike(glimpse)}>
                <span className="text-base">{glimpse.liked ? "Liked" : "Like"}</span>
                <span>{glimpse.likes}</span>
              </button>
              <button type="button" className="grid text-xs" onClick={() => setCommentsFor(glimpse.id)}>
                <span className="text-base">Notes</span>
                <span>{glimpse.comments.length}</span>
              </button>
            </div>
            <div className="absolute inset-x-4 bottom-6 grid gap-2 pr-16">
              <p className="text-sm font-medium">@{glimpse.username}</p>
              <p className="text-sm leading-5">{glimpse.caption}</p>
              {glimpse.link ? (
                <Link href={linkHref(glimpse.link)} className="justify-self-start rounded-full bg-background/90 px-3 py-1 text-xs text-foreground">
                  {glimpse.link.label}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <section className="absolute inset-x-0 bottom-0 z-20 grid max-h-[55%] gap-3 overflow-y-auto bg-card px-4 pt-4 pb-6 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Notes</h2>
            <button type="button" className="text-sm" onClick={() => setCommentsFor(null)}>
              Close
            </button>
          </div>
          <ul className="grid gap-3">
            {open.comments.length === 0 ? (
              <li className="text-sm text-muted-foreground">No notes yet.</li>
            ) : (
              open.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <span className="font-medium">{comment.displayName}</span> {comment.body}
                </li>
              ))
            )}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void sendComment(open.id);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={280}
              placeholder="Add a note"
              className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm"
            />
            <button type="submit" className="text-sm font-medium text-primary">
              Send
            </button>
          </form>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
