"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { savePost, type MediaKind } from "@/lib/mock/studio";

const kinds: { id: MediaKind; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
  { id: "glimpse", label: "Glimpse" },
];

export function PostComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<MediaKind>("photo");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!caption.trim()) {
      setError("Add a caption");
      return;
    }
    if (kind !== "video" && !imageUrl.trim()) {
      setError("Add a photo address");
      return;
    }
    if (kind !== "photo" && !videoUrl.trim()) {
      setError("Add a video address");
      return;
    }
    savePost({
      id: `post-${Date.now()}`,
      kind,
      caption: caption.trim(),
      imageUrl: imageUrl.trim() || videoUrl.trim(),
      videoUrl: kind === "photo" ? "" : videoUrl.trim(),
    });
    router.push("/storefront");
    router.refresh();
  }

  return (
    <form onSubmit={publish} className="grid gap-4 px-5 pt-6 pb-10">
      <Link href="/storefront" className="text-sm text-primary">
        Storefront
      </Link>
      <h1 className="font-display text-3xl">New post</h1>
      <div className="grid grid-cols-3 gap-2">
        {kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={kind === item.id}
            onClick={() => setKind(item.id)}
            className={`rounded-full px-3 py-2 text-sm ${
              kind === item.id ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="grid gap-1 text-sm">
        Caption
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={140}
          rows={3}
          className="rounded-2xl border border-border bg-background px-4 py-3"
        />
      </label>
      {kind !== "video" ? (
        <label className="grid gap-1 text-sm">
          Photo address
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://"
            className="rounded-2xl border border-border bg-background px-4 py-3"
          />
        </label>
      ) : null}
      {kind !== "photo" ? (
        <label className="grid gap-1 text-sm">
          Video address
          <input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://"
            className="rounded-2xl border border-border bg-background px-4 py-3"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button type="submit" className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
        Publish
      </button>
      <p className="text-sm text-muted-foreground">
        This stays on this phone for now. It is not saved to the server yet.
      </p>
    </form>
  );
}
