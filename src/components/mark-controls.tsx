"use client";

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
}: {
  traveler: boolean;
  storySlug: string;
  kind: "itinerary" | "spot";
  itinerarySlug?: string;
  spotId?: string;
  liked: boolean;
  saved: boolean;
  likes: number;
}) {
  const [state, setState] = useState({ liked, saved, likes });
  const [error, setError] = useState("");

  async function toggle(action: "like" | "save") {
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
    return likes > 0 ? <p className="text-sm text-muted-foreground">{likes} {likes === 1 ? "like" : "likes"}</p> : null;
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
