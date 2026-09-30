"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

const SHARE_TEXT =
  "Hey!! I'm excited to share my profile on TravelHues. A platform where you can plan your next destination with creators";

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  );
}

export function ShareProfileButton({ username }: { username: string }) {
  const [notice, setNotice] = useState("");

  async function share() {
    const url = `${window.location.origin}/u/${username}`;
    const clipboardText = `${SHARE_TEXT}\n${url}`;
    const data: ShareData = {
      title: "TravelHues",
      text: SHARE_TEXT,
      url,
    };
    setNotice("");

    // Prefer the system share sheet when the API (and this payload) are available.
    const canTryShare =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(data));

    if (canTryShare) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        // User cancelled the sheet — not a failure; do not copy or show "Copied".
        if (isAbortError(error)) return;
      }
    }

    try {
      await navigator.clipboard.writeText(clipboardText);
      setNotice("Copied");
    } catch {
      setNotice(clipboardText);
    }
  }

  return (
    <span className="relative mt-1 inline-flex flex-col items-end">
      <button type="button" aria-label="Share profile" onClick={() => void share()} className="text-foreground">
        <Share2 className="size-5" />
      </button>
      {notice ? <span className="absolute top-full right-0 mt-1 whitespace-nowrap text-xs text-muted-foreground">{notice}</span> : null}
    </span>
  );
}
