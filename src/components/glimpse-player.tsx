"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LoginPrompt } from "@/components/login-prompt";
import { apiBase, apiMessage, mediaUrl } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { linkHref, type Glimpse } from "@/lib/glimpse";

export function GlimpsePlayer({
  initial,
  startId,
  traveler = true,
  guest = false,
  guestCapped = false,
}: {
  initial: Glimpse[];
  startId: string;
  traveler?: boolean;
  guest?: boolean;
  guestCapped?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [glimpses, setGlimpses] = useState(initial);
  const [active, setActive] = useState(() => {
    const index = initial.findIndex((glimpse) => glimpse.id === startId);
    return index >= 0 ? index : 0;
  });
  const [sound, setSound] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!guest) return;
    try {
      window.sessionStorage.setItem("th_guest_shorts", "1");
      window.localStorage.setItem("th_guest_shorts", "1");
    } catch {
      /* ignore */
    }
  }, [guest]);

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
    try {
      const stored = window.localStorage.getItem("th_saved_shorts");
      if (!stored) return;
      const ids = JSON.parse(stored) as unknown;
      if (Array.isArray(ids)) setSaved(ids.filter((id) => typeof id === "string"));
    } catch {
      setSaved([]);
    }
  }, []);

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
    if (guest || !traveler) {
      setLoginOpen(true);
      return;
    }
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

  function toggleSave(id: string) {
    if (guest || !traveler) {
      setLoginOpen(true);
      return;
    }
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("th_saved_shorts", JSON.stringify(next));
      return next;
    });
  }

  async function share(glimpse: Glimpse) {
    const url = `${window.location.origin}/shorts?start=${glimpse.id}`;
    setNotice("");
    const data: ShareData = { title: glimpse.displayName || "Travelhues", text: glimpse.caption, url };
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
          <p>No shorts yet.</p>
          <Link href="/" className="text-sm text-primary">
            Back to explore
          </Link>
        </div>
      </div>
    );
  }

  const open = glimpses.find((glimpse) => glimpse.id === commentsFor) ?? null;

  return (
    <div className="relative h-full w-full bg-foreground text-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center px-4 pt-3">
        <Link href="/" aria-label="Travelhues" className="pointer-events-auto rounded-full bg-background/95 px-3 py-1.5">
          <Image src="/travelhues-logo.png" alt="" width={374} height={102} className="h-8 w-fit" />
        </Link>
      </div>
      <button
        type="button"
        aria-label={sound ? "Sound on" : "Sound off"}
        aria-pressed={sound}
        className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-black/40 text-white"
        onClick={() => setSound((value) => !value)}
      >
        {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </button>
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
            <div className="absolute right-3 bottom-24 z-10 grid justify-items-center gap-4 text-center text-white md:bottom-6">
              {traveler ? (
                <RailButton
                  label={glimpse.liked ? "Unlike" : "Like"}
                  pressed={glimpse.liked}
                  count={glimpse.likes}
                  onClick={() => void toggleLike(glimpse)}
                >
                  <Heart className={`size-7 ${glimpse.liked ? "fill-primary text-primary" : ""}`} />
                </RailButton>
              ) : (
                <div className="grid justify-items-center gap-0.5 text-xs drop-shadow" aria-label={`${glimpse.likes} likes`}>
                  <Heart className="size-7" />
                  <span>{glimpse.likes}</span>
                </div>
              )}
              <RailButton
                label="Notes"
                count={glimpse.comments.length}
                onClick={() => setCommentsFor(glimpse.id)}
              >
                <MessageCircle className="size-7" />
              </RailButton>
              <RailButton label="Share" onClick={() => void share(glimpse)}>
                <Share2 className="size-7" />
              </RailButton>
              {traveler ? (
                <RailButton
                  label={saved.includes(glimpse.id) ? "Remove save" : "Save"}
                  pressed={saved.includes(glimpse.id)}
                  onClick={() => toggleSave(glimpse.id)}
                >
                  <Bookmark className={`size-7 ${saved.includes(glimpse.id) ? "fill-current" : ""}`} />
                </RailButton>
              ) : null}
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-24 flex items-end gap-3 pr-16 text-white md:bottom-6">
              <Link
                href={`/u/${glimpse.username}`}
                aria-label={glimpse.displayName || glimpse.username}
                className="pointer-events-auto relative size-11 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white"
              >
                {glimpse.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(glimpse.avatarUrl)} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-sm font-medium">
                    {(glimpse.displayName || glimpse.username).slice(0, 1)}
                  </span>
                )}
              </Link>
              <div className="grid min-w-0 gap-2">
                <p className="text-sm font-medium">@{glimpse.username}</p>
                <p className="text-sm leading-5">{glimpse.caption}</p>
                {notice ? <p className="text-xs text-white/80">{notice}</p> : null}
                {glimpse.link ? (
                  <Link href={linkHref(glimpse.link)} className="pointer-events-auto justify-self-start rounded-full bg-background/90 px-3 py-1 text-xs text-foreground">
                    {glimpse.link.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {guest && guestCapped ? (
          <article
            data-index={glimpses.length}
            data-id="guest-login"
            className="relative grid h-full place-items-center snap-start bg-foreground px-6 text-center text-background"
          >
            <div className="grid max-w-sm gap-4">
              <p className="font-display text-3xl">That’s the preview</p>
              <p className="text-sm text-background/80">
                Sign in to load fresh shorts and keep scrolling.
              </p>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                onClick={() => setLoginOpen(true)}
              >
                Login to view more
              </button>
              <Link href="/" className="text-sm text-background/80 underline">
                Back to explore
              </Link>
            </div>
          </article>
        ) : null}
      </div>
      <LoginPrompt
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="Sign in to watch more shorts"
        body="You’ve seen a preview. Sign in to load fresh shorts and keep scrolling."
      />
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

function RailButton({
  label,
  pressed,
  count,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid justify-items-center gap-0.5 text-xs drop-shadow"
    >
      {children}
      {typeof count === "number" ? <span>{count}</span> : null}
    </button>
  );
}
