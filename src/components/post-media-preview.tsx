"use client";

import { useEffect, useRef, useState } from "react";

import { StreamingVideo } from "@/components/streaming-video";
import { mediaUrl } from "@/lib/api";
import { resolvePlaybackSrc } from "@/lib/video-stream";

export function PostMediaPreview({
  imageUrl,
  videoUrl,
  streamUrl,
  className = "size-full object-cover",
  lazy = true,
}: {
  imageUrl: string;
  videoUrl?: string;
  streamUrl?: string;
  className?: string;
  lazy?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  const playback = videoUrl ? resolvePlaybackSrc(videoUrl, streamUrl) : "";

  if (imageUrl) {
    return (
      <div ref={rootRef} className="size-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(imageUrl)} alt="" className={className} />
      </div>
    );
  }
  if (playback) {
    return (
      <div ref={rootRef} className="size-full">
        <StreamingVideo
          src={playback}
          muted
          playsInline
          shouldLoad={visible}
          shouldPlay={false}
          className={className}
        />
      </div>
    );
  }
  return <div ref={rootRef} className="size-full" />;
}
