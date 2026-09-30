"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { BackLink } from "@/components/back-link";
import { Loader } from "@/components/loader";
import { savePost, type PostMedia } from "@/lib/mock/studio";

const maxItems = 5;
const maxSeconds = 60;

type DraftMedia = PostMedia & { id: string };

export function CreateMenu({
  onChoose,
}: {
  onChoose: (kind: "post" | "glimpse") => void;
}) {
  const [open, setOpen] = useState(false);

  function choose(kind: "post" | "glimpse") {
    setOpen(false);
    onChoose(kind);
  }

  return (
    <div className="absolute right-5 bottom-5 z-20 flex flex-col items-end gap-2">
      {open ? (
        <div className="grid gap-2">
          <MenuChoice label="Post" onClick={() => choose("post")} />
          <MenuChoice label="Short" onClick={() => choose("glimpse")} />
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close" : "Create"}
        onClick={() => setOpen((value) => !value)}
        className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(225,46,47,0.35)]"
      >
        <Plus className={`size-6 ${open ? "rotate-45" : ""}`} />
      </button>
    </div>
  );
}

export function PostForm({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const room = maxItems - media.length;
    if (room <= 0) {
      setError("A post can hold 5 files");
      return;
    }
    const chosen = [...list].slice(0, room);
    if (list.length > room) setError("A post can hold 5 files");
    setReading(true);
    try {
      const next: DraftMedia[] = [];
      for (const file of chosen) {
        next.push({ id: `${file.name}-${file.size}-${next.length}`, ...(await readMedia(file)) });
      }
      setMedia((current) => [...current, ...next].slice(0, maxItems));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that file");
    } finally {
      setReading(false);
    }
  }

  function remove(id: string) {
    setMedia((current) => current.filter((item) => item.id !== id));
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (media.length < 1) {
      setError("Add at least one photo or video");
      return;
    }
    if (!caption.trim()) {
      setError("Add a caption");
      return;
    }
    const first = media[0];
    const onlyPhotos = media.every((item) => item.kind === "photo");
    savePost({
      id: `post-${Date.now()}`,
      kind: onlyPhotos ? "photo" : "video",
      caption: caption.trim(),
      imageUrl: first.imageUrl,
      videoUrl: first.kind === "video" ? first.videoUrl : "",
      media: media.map(({ kind, imageUrl, videoUrl }) => ({ kind, imageUrl, videoUrl })),
    });
    onPosted();
  }

  return (
    <form onSubmit={publish} className="grid gap-4 px-5 pt-5 pb-10">
      <BackLink onClick={onClose} />
      <h1 className="font-display text-3xl">New post</h1>
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">1 to 5 photos or videos. Videos up to 60 seconds.</p>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {media.map((item) => (
            <li key={item.id} className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <video src={item.videoUrl} muted playsInline className="size-full object-cover" />
              )}
              {item.kind === "video" ? (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
                  Video
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Remove"
                onClick={() => remove(item.id)}
                className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/55 text-white"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
          {media.length < maxItems ? (
            <li>
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-foreground/25 text-sm text-muted-foreground">
                {reading ? "Reading" : "Add"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    void addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </li>
          ) : null}
        </ul>
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
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={reading}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {reading ? <Loader label="Preparing" /> : "Post"}
      </button>
    </form>
  );
}

export function GlimpseComposer({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [clip, setClip] = useState<DraftMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      if (!file.type.startsWith("video/")) throw new Error("A short is a video");
      const media = await readMedia(file);
      if (media.kind !== "video") throw new Error("A short is a video");
      setClip({ id: file.name, ...media });
    } catch (caught) {
      setClip(null);
      setError(caught instanceof Error ? caught.message : "Could not read that video");
    } finally {
      setReading(false);
    }
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!clip) {
      setError("Add a video");
      return;
    }
    if (!caption.trim()) {
      setError("Add a caption");
      return;
    }
    savePost({
      id: `glimpse-${Date.now()}`,
      kind: "glimpse",
      caption: caption.trim(),
      imageUrl: clip.imageUrl,
      videoUrl: clip.videoUrl,
      media: [{ kind: "video", imageUrl: clip.imageUrl, videoUrl: clip.videoUrl }],
    });
    onPosted();
  }

  return (
    <form onSubmit={publish} className="grid gap-4 px-5 pt-5 pb-10">
      <BackLink onClick={onClose} />
      <h1 className="font-display text-3xl">New short</h1>
      <p className="text-sm text-muted-foreground">One video, up to 60 seconds.</p>
      <label className="grid cursor-pointer gap-2 text-sm">
        {clip?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.imageUrl} alt="" className="aspect-[9/16] max-h-80 w-full rounded-2xl object-cover" />
        ) : (
          <span className="grid aspect-[9/16] max-h-80 place-items-center rounded-2xl border border-dashed border-foreground/25 text-muted-foreground">
            {reading ? "Reading" : "Add video"}
          </span>
        )}
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
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
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={reading}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {reading ? <Loader label="Preparing" /> : "Post"}
      </button>
    </form>
  );
}

function MenuChoice({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(18,35,42,0.08)]"
    >
      {label}
    </button>
  );
}

async function readMedia(file: File): Promise<PostMedia> {
  if (file.type.startsWith("image/")) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Use a JPEG, PNG, or WebP photo");
    }
    if (file.size > 8_000_000) throw new Error("Photo must be under 8 MB");
    return { kind: "photo", imageUrl: await readDataUrl(file), videoUrl: "" };
  }
  if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
    throw new Error("Use a photo or an MP4, MOV, or WebM video");
  }
  if (file.size > 40_000_000) throw new Error("Video must be under 40 MB");
  return readClip(file);
}

function readClip(file: File) {
  const videoUrl = URL.createObjectURL(file);
  return new Promise<PostMedia>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration > maxSeconds) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Video must be 60 seconds or shorter"));
        return;
      }
      const target = Math.min(0.2, video.duration / 2);
      if (target > 0) video.currentTime = target;
      else paintFrame();
    };
    video.onseeked = () => paintFrame();
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Could not read that video"));
    };

    function paintFrame() {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 360;
      canvas.height = video.videoHeight || 640;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve({ kind: "video", videoUrl, imageUrl: "" });
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve({ kind: "video", videoUrl, imageUrl: canvas.toDataURL("image/jpeg", 0.72) });
    }
  });
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.readAsDataURL(file);
  });
}
