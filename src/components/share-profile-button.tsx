"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

const SHARE_TEXT =
  "Hey!! I'm excited to share my profile on TravelHues. A platform where you can plan your next destination with creators";

export function ShareProfileButton({ username }: { username: string }) {
  const [notice, setNotice] = useState("");

  async function share() {
    const url = `${window.location.origin}/u/${username}`;
    const text = `${SHARE_TEXT}\n${url}`;
    setNotice("");
    if (navigator.share) {
      try {
        await navigator.share({ title: "TravelHues", text: SHARE_TEXT, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied");
    } catch {
      setNotice(text);
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
