"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { compressImage } from "@/components/profile-fields";
import { readCookie } from "@/lib/browser-session";
import { uploadPostMedia } from "@/lib/post-media";
import { savePost, type MediaKind } from "@/lib/mock/studio";

const kinds: { id: MediaKind; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
  { id: "glimpse", label: "Hue" },
];

export function PostComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<MediaKind>("photo");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function chooseKind(next: MediaKind) {
    setKind(next);
    setImageUrl("");
    setVideoUrl("");
    setFileName("");
    setError("");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      if (kind === "photo") {
        setImageUrl(await readPhoto(file));
        setVideoUrl("");
      } else {
        const clip = await readClip(file);
        setVideoUrl(clip.videoUrl);
        setImageUrl(clip.imageUrl);
      }
      setFileName(file.name);
    } catch (caught) {
      setImageUrl("");
      setVideoUrl("");
      setFileName("");
      setError(caught instanceof Error ? caught.message : "Could not read that file");
    } finally {
      setReading(false);
    }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!caption.trim()) {
      setError("Add a caption");
      return;
    }
    if (kind === "photo" && !imageUrl) {
      setError("Choose a photo");
      return;
    }
    if (kind !== "photo" && !videoUrl) {
      setError("Choose a video");
      return;
    }
    const token = readCookie("th_access");
    if (!token) {
      setError("Sign in again to post");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const uploadedImage = imageUrl ? await uploadPostMedia(token, imageUrl) : "";
      const uploadedVideo =
        kind === "photo" ? "" : await uploadPostMedia(token, videoUrl);
      savePost({
        id: `post-${Date.now()}`,
        kind,
        caption: caption.trim(),
        imageUrl: uploadedImage,
        videoUrl: uploadedVideo,
      });
      router.push("/storefront");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not publish that post");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form onSubmit={publish} className="grid h-full gap-4 overflow-y-auto px-5 pt-6 pb-10 md:mx-auto md:max-w-2xl">
      <Link href="/storefront" className="text-sm text-primary">
        Home
      </Link>
      <h1 className="font-display text-3xl">New post</h1>
      <div className="grid grid-cols-3 gap-2">
        {kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={kind === item.id}
            onClick={() => chooseKind(item.id)}
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
      <label className="grid gap-2 text-sm">
        {kind === "photo" ? "Photo" : "Video"}
        <span className="text-muted-foreground">
          {kind === "photo" ? "JPEG, PNG, or WebP under 8 MB" : "MP4, MOV, or WebM under 40 MB"}
        </span>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="aspect-square w-full rounded-2xl object-cover" />
        ) : (
          <span className="grid aspect-square place-items-center rounded-2xl bg-secondary text-muted-foreground">
            {reading ? "Reading…" : "No file yet"}
          </span>
        )}
        <input
          key={kind}
          type="file"
          accept={kind === "photo" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm"}
          onChange={(event) => void onFile(event.target.files?.[0])}
          className="text-sm"
        />
        {fileName ? <span className="text-muted-foreground">{fileName}</span> : null}
      </label>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={reading || publishing}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {reading || publishing ? <Loader label={publishing ? "Uploading" : "Preparing"} /> : "Publish"}
      </button>
      <p className="text-sm text-muted-foreground">
        Photos and videos upload to your Travelhues account when you publish.
      </p>
    </form>
  );
}

function readPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Use a JPEG, PNG, or WebP photo"));
  }
  if (file.size > 8_000_000) return Promise.reject(new Error("Photo must be under 8 MB"));
  return compressImage(file, 1920);
}

function readClip(file: File) {
  if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
    return Promise.reject(new Error("Use an MP4, MOV, or WebM video"));
  }
  if (file.size > 40_000_000) return Promise.reject(new Error("Video must be under 40 MB"));
  const videoUrl = URL.createObjectURL(file);
  return new Promise<{ videoUrl: string; imageUrl: string }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;
    video.onloadeddata = () => {
      const target = Number.isFinite(video.duration) ? Math.min(0.2, video.duration / 2) : 0;
      if (target > 0) video.currentTime = target;
      else paintFrame();
    };
    video.onseeked = () => paintFrame();
    video.onerror = () => reject(new Error("Could not read that video"));

    function paintFrame() {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 360;
      canvas.height = video.videoHeight || 640;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve({ videoUrl, imageUrl: "" });
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve({ videoUrl, imageUrl: canvas.toDataURL("image/jpeg", 0.72) });
    }
  });
}
