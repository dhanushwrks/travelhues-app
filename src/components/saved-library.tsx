"use client";

import Link from "next/link";
import { useState } from "react";

import type { ContentMark } from "@/lib/marks";

export function SavedLibrary({ marks }: { marks: ContentMark[] }) {
  const [tab, setTab] = useState<"spots" | "itineraries">("spots");
  const spots = marks.filter((mark) => mark.kind === "spot");
  const itineraries = marks.filter((mark) => mark.kind === "itinerary");
  const items = tab === "spots" ? spots : itineraries;

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="px-5 pt-5">
        <Link href="/account" className="text-sm font-medium">
          Profile
        </Link>
        <h1 className="mt-3 font-display text-3xl">Saved</h1>
      </header>
      <div className="mt-5 grid grid-cols-2 border-b border-border">
        <Tab label="Finds" count={spots.length} pressed={tab === "spots"} onClick={() => setTab("spots")} />
        <Tab
          label="Itineraries"
          count={itineraries.length}
          pressed={tab === "itineraries"}
          onClick={() => setTab("itineraries")}
        />
      </div>
      {items.length === 0 ? (
        <p className="px-5 pt-8 text-sm text-muted-foreground">
          {tab === "spots" ? "Save a find from a story and it lands here." : "Save an itinerary from a destination and it lands here."}
        </p>
      ) : (
        <ul className="grid gap-px bg-border md:grid-cols-2">
          {items.map((mark) => (
            <li key={`${mark.kind}-${mark.storySlug}-${mark.itinerarySlug}-${mark.spotId}`} className="bg-card">
              <Link
                href={
                  mark.kind === "spot"
                    ? `/stories/${mark.storySlug}?find=${mark.spotId}`
                    : `/stories/${mark.storySlug}/itineraries/${mark.itinerarySlug}`
                }
                className="block px-5 py-4"
              >
                <span className="block font-medium">{mark.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{mark.storyTitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tab({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-11 text-sm font-medium ${pressed ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
    >
      {label}
      <span className="ml-1 text-muted-foreground">{count}</span>
    </button>
  );
}
