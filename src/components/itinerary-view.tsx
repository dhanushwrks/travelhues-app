"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, List, Map } from "lucide-react";

import { SpotSheet } from "@/components/spot-sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { MarkControls } from "@/components/mark-controls";
import { spotById, spotsInOrder } from "@/lib/itinerary";
import { markState, type Library } from "@/lib/marks";
import type { Itinerary, Story } from "@/lib/types";

const RouteMap = dynamic(
  () => import("@/components/maps").then((mod) => mod.RouteMap),
  { ssr: false, loading: () => <div className="h-full bg-muted" /> },
);

export function ItineraryView({
  story,
  itinerary,
  traveler,
  library,
}: {
  story: Story;
  itinerary: Itinerary;
  traveler: boolean;
  library: Library;
}) {
  const [day, setDay] = useState<number | "overview">("overview");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleDays = useMemo(
    () =>
      day === "overview"
        ? itinerary.days
        : [itinerary.days[day]].filter((item) => item !== undefined),
    [day, itinerary.days],
  );
  const points = useMemo(
    () =>
      spotsInOrder(story, visibleDays).map((spot) => ({
        id: spot.id,
        lng: spot.lng,
        lat: spot.lat,
        label: spot.title,
      })),
    [story, visibleDays],
  );
  const openSpot = story.spots.find((spot) => spot.id === openId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-3 px-5 pt-4">
        <Link
          href={`/stories/${story.slug}`}
          className="inline-flex h-11 items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          {story.title}
        </Link>
        <div>
          <h1 className="font-display text-3xl leading-tight">{itinerary.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Itinerary by{" "}
            <Link href={`/u/${story.creator.username}`} className="text-foreground">
              {story.creator.displayName}
            </Link>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium">What you’ll do</h2>
          <p className="mt-1 text-[15px] leading-6">{itinerary.summary}</p>
        </div>
        <MarkControls
          traveler={traveler}
          storySlug={story.slug}
          kind="itinerary"
          itinerarySlug={itinerary.slug}
          {...markState(library, "itinerary", story.slug, itinerary.slug)}
        />
      </header>
      <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
        <DayChip
          label="Overview"
          pressed={day === "overview"}
          onClick={() => setDay("overview")}
        />
        {itinerary.days.map((item, index) => (
          <DayChip
            key={item.title}
            label={`Day ${index + 1}`}
            pressed={day === index}
            onClick={() => setDay(index)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 px-5 py-2">
        <ModeButton
          label="List"
          icon={<List className="size-4" />}
          pressed={mode === "list"}
          onClick={() => setMode("list")}
        />
        <ModeButton
          label="Map"
          icon={<Map className="size-4" />}
          pressed={mode === "map"}
          onClick={() => setMode("map")}
        />
      </div>
      {mode === "list" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-8">
          {visibleDays.map((item) => {
            const index = itinerary.days.indexOf(item);
            return (
              <section key={`${item.title}-${index}`} className="mb-6">
                <h3 className="text-base font-medium">
                  Day {index + 1}
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    {item.title}
                  </span>
                </h3>
                <ul className="mt-3 space-y-3">
                  {item.blocks.map((block, blockIndex) => {
                    if (block.kind === "note") {
                      return (
                        <li
                          key={blockIndex}
                          className="rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-6"
                        >
                          {block.body}
                        </li>
                      );
                    }
                    const spot = spotById(story, block.spotId);
                    if (!spot) return null;
                    const meta = spotTypeMeta[spot.type];
                    const Icon = meta.icon;
                    return (
                      <li key={blockIndex}>
                        <button
                          type="button"
                          onClick={() => setOpenId(spot.id)}
                          className="w-full rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-border"
                        >
                          <span
                            className={`flex items-center gap-2 text-base font-medium ${meta.ink}`}
                          >
                            <Icon className="size-4" />
                            {spot.title}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                            {block.body}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          <RouteMap
            key={`${day}-${points.map((point) => point.id).join("-")}`}
            points={points}
            onSelect={setOpenId}
          />
        </div>
      )}
      <SpotSheet
        spot={openSpot}
        open={openSpot !== null}
        storySlug={story.slug}
        traveler={traveler}
        liked={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).liked : false}
        saved={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).saved : false}
        likes={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).likes : 0}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

function DayChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-11 shrink-0 rounded-full px-4 text-sm font-medium ${
        pressed
          ? "bg-primary text-primary-foreground"
          : "bg-white text-foreground ring-1 ring-border"
      }`}
    >
      {label}
    </button>
  );
}

function ModeButton({
  label,
  icon,
  pressed,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium ${
        pressed
          ? "bg-foreground text-card"
          : "bg-white text-foreground ring-1 ring-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
