"use client";

import { mediaUrl } from "@/lib/api";

export function PostMediaPreview({
  imageUrl,
  videoUrl,
  className = "size-full object-cover",
}: {
  imageUrl: string;
  videoUrl?: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaUrl(imageUrl)} alt="" className={className} />
    );
  }
  if (videoUrl) {
    return (
      <video
        src={mediaUrl(videoUrl)}
        muted
        playsInline
        preload="metadata"
        className={className}
      />
    );
  }
  return null;
}
