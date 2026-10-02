"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";

import { isHlsSource } from "@/lib/video-stream";

type StreamingVideoProps = {
  src: string;
  poster?: string;
  /** Attach media and buffer when true. */
  shouldLoad?: boolean;
  /** Play when true; pause when false. */
  shouldPlay?: boolean;
  className?: string;
  onError?: () => void;
} & Omit<
  ComponentPropsWithoutRef<"video">,
  "src" | "poster" | "preload" | "autoPlay" | "ref"
>;

export function StreamingVideo({
  src,
  poster,
  shouldLoad = true,
  shouldPlay = false,
  className,
  onError,
  muted = true,
  loop,
  playsInline = true,
  controls,
  ...rest
}: StreamingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!shouldLoad || !src) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    let destroyed = false;
    let hls: import("hls.js").default | null = null;

    const clear = () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    if (isHlsSource(src)) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        void import("hls.js").then(({ default: Hls }) => {
          if (destroyed || !videoRef.current) return;
          if (!Hls.isSupported()) {
            onError?.();
            return;
          }
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.on(Hls.Events.ERROR, () => onError?.());
          hls.loadSource(src);
          hls.attachMedia(video);
        });
      }
    } else {
      video.src = src;
    }

    return () => {
      destroyed = true;
      clear();
    };
  }, [shouldLoad, src, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad || !src) return;
    video.muted = muted;
    if (shouldPlay) {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }, [shouldLoad, shouldPlay, src, muted]);

  return (
    <video
      ref={videoRef}
      poster={poster || undefined}
      className={className}
      playsInline={playsInline}
      loop={loop}
      muted={muted}
      controls={controls}
      preload={shouldLoad ? (shouldPlay ? "auto" : "metadata") : "none"}
      onError={() => onError?.()}
      {...rest}
    />
  );
}
