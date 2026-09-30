"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, List, Map } from "lucide-react";

import { Loader } from "@/components/loader";
import { SpotSheet } from "@/components/spot-sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { MarkControls } from "@/components/mark-controls";
import { formatCost, formatDuration, formatInr } from "@/lib/format";
import { itineraryBudget, spotById } from "@/lib/itinerary";
import { markState, type Library } from "@/lib/marks";
import { storyHref, type Block, type Day, type Itinerary, type Spot, type Story } from "@/lib/types";

const RouteMap = dynamic(
  () => import("@/components/maps").then((mod) => mod.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-muted">
        <Loader className="size-5 text-primary" />
      </div>
    ),
  },
);

export function ItineraryView({
  story,
  itinerary,
  traveler,
  library,
  editHref,
}: {
  story: Story;
  itinerary: Itinerary;
  traveler: boolean;
  library: Library;
  editHref?: string;
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
  const timeline = useMemo(
    () => buildTimeline(story, itinerary.days, visibleDays),
    [story, itinerary.days, visibleDays],
  );
  const points = useMemo(() => {
    const seen = new Set<string>();
    return timeline.flatMap((section) =>
      section.entries.flatMap((entry) => {
        if (entry.kind !== "spot") return [];
        if (day === "overview") {
          if (seen.has(entry.spot.id)) return [];
          seen.add(entry.spot.id);
        }
        return [{ id: entry.spot.id, lng: entry.spot.lng, lat: entry.spot.lat, label: entry.spot.title, type: entry.spot.type }];
      }),
    );
  }, [timeline, day]);
  const stopCount = points.length;
  const budget = useMemo(() => itineraryBudget(story, itinerary.days), [story, itinerary.days]);
  const visibleBudget = useMemo(() => itineraryBudget(story, visibleDays), [story, visibleDays]);
  const openSpot = story.spots.find((spot) => spot.id === openId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-3 px-5 pt-4">
        <Link
          href={storyHref(story)}
          className="inline-flex h-11 items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          {story.title}
        </Link>
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl leading-tight">{itinerary.title}</h1>
            {editHref ? (
              <Link href={editHref} className="mt-1 shrink-0 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                Edit
              </Link>
            ) : null}
          </div>
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
          {budget.total > 0 ? (
            <p className="mt-3 text-sm leading-6">
              <span className="font-medium">Average budget </span>
              <span className="text-muted-foreground">
                {formatInr(budget.perDay)} a day, {formatInr(budget.total)} for the stops on this plan.
              </span>
            </p>
          ) : null}
        </div>
        <MarkControls
          traveler={traveler}
          storySlug={story.slug}
          kind="itinerary"
          itinerarySlug={itinerary.slug}
          {...markState(library, "itinerary", story.slug, itinerary.slug)}
          icons
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
      <p className="px-5 pb-2 text-sm text-muted-foreground">
        {stopCount} {stopCount === 1 ? "stop" : "stops"}
        {day === "overview" ? ` across ${itinerary.days.length} days` : ""}
        {day !== "overview" && visibleBudget.total > 0 ? ` · ${formatInr(visibleBudget.total)} this day` : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 px-5 py-2 lg:hidden">
        <ModeButton
          label="Timeline"
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
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className={`min-h-0 overflow-y-auto px-5 pt-2 pb-8 ${mode === "map" ? "hidden lg:block" : ""}`}>
          {timeline.map((section) => (
            <section key={section.key} className="mb-8">
              <h3 className="text-base font-medium">
                Day {section.dayNumber}
                <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{section.title}</span>
              </h3>
              <ol className="relative mt-4">
                <span className="absolute top-3 bottom-3 left-[13px] w-px bg-border" aria-hidden />
                {section.entries.map((entry, entryIndex) =>
                  entry.kind === "note" ? (
                    <li key={entryIndex} className="relative flex gap-3 pb-5">
                      <span className="relative z-10 grid size-7 shrink-0 place-items-center" aria-hidden>
                        <span className="size-2.5 rounded-full bg-foreground/25" />
                      </span>
                      <p className="pt-1 text-sm leading-6 text-muted-foreground">{entry.body}</p>
                    </li>
                  ) : (
                    <li key={entryIndex} className="relative flex gap-3 pb-5">
                      <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {entry.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenId(entry.spot.id)}
                        className="flex min-w-0 flex-1 gap-3 rounded-2xl bg-card p-2 text-left ring-1 ring-border"
                      >
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <SpotThumb spot={entry.spot} />
                        </span>
                        <span className="min-w-0 py-0.5">
                          <span className="block text-sm font-medium">{entry.spot.title}</span>
                          <span className={`mt-0.5 block text-xs ${spotTypeMeta[entry.spot.type].ink}`}>
                            {spotTypeMeta[entry.spot.type].label}
                            {entry.meta ? ` · ${entry.meta}` : ""}
                          </span>
                          {entry.body ? (
                            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{entry.body}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ),
                )}
              </ol>
            </section>
          ))}
        </div>
        <div className={`h-full min-h-[24rem] overflow-hidden lg:border-l lg:border-border ${mode === "list" ? "hidden lg:block" : ""}`}>
          <RouteMap
            key={`${day}-${points.map((point) => point.id).join("-")}`}
            points={points}
            connected={day !== "overview"}
            onSelect={setOpenId}
          />
        </div>
      </div>
      <SpotSheet
        spot={openSpot}
        open={openSpot !== null}
        storySlug={story.slug}
        traveler={traveler}
        liked={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).liked : false}
        saved={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).saved : false}
        likes={openSpot ? markState(library, "spot", story.slug, "", openSpot.id).likes : 0}
        icons
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

function buildTimeline(story: Story, allDays: Day[], visibleDays: Day[]) {
  let number = 0;
  return visibleDays.map((day) => ({
    key: `day-${allDays.indexOf(day)}`,
    dayNumber: allDays.indexOf(day) + 1,
    title: day.title,
    entries: day.blocks.flatMap((block) =>
      toEntry(story, block, () => {
        number += 1;
        return number;
      }),
    ),
  }));
}

type TimelineEntry =
  | { kind: "note"; body: string }
  | { kind: "spot"; number: number; spot: Spot; body: string; meta: string };

function toEntry(story: Story, block: Block, nextNumber: () => number): TimelineEntry[] {
  if (block.kind === "note") return [{ kind: "note" as const, body: block.body }];
  const spot = spotById(story, block.spotId);
  if (!spot) return [];
  const meta = [spot.avgMinutes > 0 ? formatDuration(spot.avgMinutes, spot.type) : "", spot.avgCostThb > 0 ? formatCost(spot.avgCostThb, spot.type) : ""]
    .filter(Boolean)
    .join(" · ");
  return [{ kind: "spot" as const, number: nextNumber(), spot, body: block.body, meta }];
}

function SpotThumb({ spot }: { spot: Spot }) {
  const src = spot.images[0];
  if (!src) {
    const Icon = spotTypeMeta[spot.type].icon;
    return (
      <span className="grid size-full place-items-center text-muted-foreground">
        <Icon className="size-5" />
      </span>
    );
  }
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="64px" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="size-full object-cover" />;
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
