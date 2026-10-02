"use client";

import { Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";

import { StreamingVideo } from "@/components/streaming-video";
import { mediaUrl } from "@/lib/api";

export function ProfileAvatar({
  name,
  avatar,
  introVideoUrl,
  avatarSlot,
}: {
  name: string;
  avatar?: React.ReactNode;
  introVideoUrl?: string;
  avatarSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const src = introVideoUrl ? mediaUrl(introVideoUrl) : "";
  const hasIntro = Boolean(src);

  return (
    <div className="absolute bottom-0 left-4 z-10 size-28">
      {hasIntro ? (
        <button
          type="button"
          aria-label="Play introduction"
          onClick={() => setOpen(true)}
          className="relative block size-full rounded-full bg-primary p-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[5px] border-card bg-secondary font-display text-3xl">
            {avatar ?? name.slice(0, 1)}
          </span>
        </button>
      ) : (
        <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[5px] border-card bg-secondary font-display text-3xl">
          {avatar ?? name.slice(0, 1)}
        </span>
      )}
      {avatarSlot}
      {open && src ? <IntroVideoModal src={src} name={name} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function IntroVideoModal({
  src,
  name,
  onClose,
}: {
  src: string;
  name: string;
  onClose: () => void;
}) {
  const [sound, setSound] = useState(true);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white">
      <button
        type="button"
        aria-label="Close introduction"
        className="absolute top-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-white/15"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <button
        type="button"
        aria-label={sound ? "Mute introduction" : "Unmute introduction"}
        aria-pressed={sound}
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/15"
        onClick={() => setSound((value) => !value)}
      >
        {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </button>
      <div className="relative h-full w-full max-w-md">
        <StreamingVideo
          src={src}
          className="size-full object-contain"
          playsInline
          loop
          shouldLoad
          shouldPlay
          muted={!sound}
          controls={false}
        />
        <p className="pointer-events-none absolute inset-x-4 bottom-10 text-center text-sm font-medium">
          {name}
        </p>
      </div>
    </div>
  );
}
