"use client";

import { Bookmark, Heart } from "lucide-react";
import { useState } from "react";

import { apiBase, apiMessage } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";

export function MarkControls({
  traveler,
  storySlug,
  kind,
  itinerarySlug = "",
  spotId = "",
  liked,
  saved,
  likes,
  icons = false,
}: {
  traveler: boolean;
  storySlug: string;
  kind: "itinerary" | "spot";
  itinerarySlug?: string;
  spotId?: string;
  liked: boolean;
  saved: boolean;
  likes: number;
  icons?: boolean;
}) {
  const [state, setState] = useState({ liked, saved, likes });
  const [error, setError] = useState("");

  async function toggle(action: "like" | "save") {
    if (!traveler) return;
    setError("");
    const response = await fetch(`${apiBase}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({ action, kind, storySlug, itinerarySlug, spotId }),
    });
    if (!response.ok) {
      setError(await apiMessage(response));
      return;
    }
    setState((await response.json()) as { liked: boolean; saved: boolean; likes: number });
  }

  if (!traveler) {
    if (!icons || likes <= 0) {
      return likes > 0 ? <p className="text-sm text-muted-foreground">{likes} {likes === 1 ? "like" : "likes"}</p> : null;
    }
    return (
      <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Heart className="size-4" />
        {likes}
      </p>
    );
  }

  if (icons) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={state.liked ? "Unlike" : "Like"}
          aria-pressed={state.liked}
          onClick={() => void toggle("like")}
          className={`inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${
            state.liked ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <Heart className={`size-4 ${state.liked ? "fill-current" : ""}`} />
          {state.likes > 0 ? state.likes : null}
        </button>
        <button
          type="button"
          aria-label={state.saved ? "Remove save" : "Save"}
          aria-pressed={state.saved}
          onClick={() => void toggle("save")}
          className={`inline-flex size-11 items-center justify-center rounded-full ${
            state.saved ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <Bookmark className={`size-4 ${state.saved ? "fill-current" : ""}`} />
        </button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle("like")}
        className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium"
      >
        {state.liked ? "Liked" : "Like"}
        {state.likes > 0 ? ` ${state.likes}` : ""}
      </button>
      <button
        type="button"
        onClick={() => void toggle("save")}
        className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium"
      >
        {state.saved ? "Saved" : "Save"}
      </button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
