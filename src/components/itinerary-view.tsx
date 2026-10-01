"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Bed,
  Bike,
  Bus,
  Car,
  CarTaxiFront,
  ExternalLink,
  Footprints,
  Lock,
  Plane,
  Ticket,
  ChevronLeft,
  List,
  Map,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { Loader } from "@/components/loader";
import { PurchaseLockBadge, PurchaseSheet } from "@/components/purchase-sheet";
import { ReportControl } from "@/components/report-control";
import { SpotSheet } from "@/components/spot-sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { MarkControls } from "@/components/mark-controls";
import { formatCommuteDistance, formatCommuteMinutes, commuteModeLabel } from "@/lib/commute";
import { formatCost, formatDuration, formatInr } from "@/lib/format";
import { itineraryBudget, spotById } from "@/lib/itinerary";
import { markState, type Library } from "@/lib/marks";
import {
  formatDayRange,
  reservationsForDay,
  storyHref,
  type Block,
  type CommuteLeg,
  type Day,
  type Itinerary,
  type Reservation,
  type ReservationType,
  type Spot,
  type Story,
} from "@/lib/types";

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

const reservationIcons: Record<ReservationType, typeof Plane> = {
  stay: Bed,
  rental: Car,
  flight: Plane,
  experience: Ticket,
};

const reservationLabels: Record<ReservationType, string> = {
  stay: "Stay",
  rental: "Rental",
  flight: "Flight",
  experience: "Experience",
};

const commuteIcons = {
  walk: Footprints,
  cycle: Bike,
  cab: CarTaxiFront,
  public: Bus,
  self_drive: Car,
  flight: Plane,
} as const;

export function ItineraryView({
  story,
  itinerary,
  traveler,
  library,
  editHref,
  backHref,
  backLabel,
}: {
  story: Story;
  itinerary: Itinerary;
  traveler: boolean;
  library: Library;
  editHref?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [day, setDay] = useState<number | "overview">("overview");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const hideIntro = scrolled || mode === "map";
  const allReservations = itinerary.reservations ?? [];
  const locked = Boolean(itinerary.locked);

  const visibleDays = useMemo(
    () =>
      day === "overview"
        ? itinerary.days
        : [itinerary.days[day]].filter((item) => item !== undefined),
    [day, itinerary.days],
  );
  const timeline = useMemo(
    () => buildTimeline(story, itinerary.days, visibleDays, allReservations),
    [story, itinerary.days, visibleDays, allReservations],
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
  const budget = useMemo(
    () => itineraryBudget(story, itinerary.days, allReservations),
    [story, itinerary.days, allReservations],
  );
  const visibleBudget = useMemo(() => {
    if (day === "overview") return budget;
    const dayReservations = reservationsForDay(allReservations, day);
    return itineraryBudget(story, visibleDays, dayReservations);
  }, [budget, day, story, visibleDays, allReservations]);
  const openSpot = story.spots.find((spot) => spot.id === openId) ?? null;

  function askPurchase() {
    if (!locked) return;
    setPurchaseOpen(true);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 bg-card">
        <div className="space-y-3 px-5 pt-4">
          <Link
            href={backHref ?? storyHref(story)}
            className="inline-flex h-11 items-center gap-1 text-sm font-medium text-primary"
          >
            <ChevronLeft className="size-4" />
            {backLabel ?? story.title}
          </Link>
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl leading-tight">{itinerary.title}</h1>
              {editHref ? (
                <Link href={editHref} className="mt-1 shrink-0 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                  Edit
                </Link>
              ) : locked ? (
                <button
                  type="button"
                  onClick={askPurchase}
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-border"
                  aria-label="Purchase to unlock"
                >
                  <Lock className="size-3.5" />
                </button>
              ) : (
                <ReportControl
                  className="mt-2"
                  targetKind="itinerary"
                  targetId={itinerary.slug}
                  targetLabel={itinerary.title}
                  targetOwnerUsername={story.creator.username}
                  targetOwnerRole="tcc"
                />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Itinerary by{" "}
              <Link href={`/u/${story.creator.username}`} className="text-foreground">
                {story.creator.displayName}
              </Link>
            </p>
          </div>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
              hideIntro ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
            }`}
          >
            <div className="overflow-hidden" inert={hideIntro ? true : undefined}>
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-medium">What you’ll do</h2>
                  <p className="mt-1 text-[15px] leading-6">{itinerary.summary}</p>
                  {budget.total > 0 ? (
                    <p className="mt-3 text-sm leading-6">
                      <span className="font-medium">Average budget </span>
                      <span className="text-muted-foreground">
                        {formatInr(budget.perDay)} a day, {formatInr(budget.total)} including stops, transfers, and
                        suggested reservations.
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
              </div>
            </div>
          </div>
        </div>
      <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
        <DayChip
          label="Overview"
          pressed={day === "overview"}
          onClick={() => setDay("overview")}
        />
        {itinerary.days.map((item, index) => (
          <DayChip
            key={`${item.title}-${index}`}
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
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div
          ref={listRef}
          onScroll={() => setScrolled((listRef.current?.scrollTop ?? 0) > 12)}
          className={`min-h-0 overflow-y-auto px-5 pt-2 pb-8 ${mode === "map" ? "hidden lg:block" : ""}`}
        >
          {locked
            ? visibleDays.map((section, index) => {
                const dayNumber =
                  day === "overview" ? index + 1 : typeof day === "number" ? day + 1 : index + 1;
                return (
                  <section key={`locked-${dayNumber}-${section.title}`} className="mb-8">
                    <h3 className="text-base font-medium">
                      Day {dayNumber}
                      <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                        {section.title}
                      </span>
                    </h3>
                    <ol className="relative mt-4">
                      {[0, 1, 2].map((slot) => (
                        <li key={slot} className="relative flex gap-3 pb-5">
                          <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                            {slot + 1}
                          </span>
                          <button
                            type="button"
                            onClick={askPurchase}
                            className="relative flex min-w-0 flex-1 overflow-hidden rounded-2xl bg-card p-2 text-left ring-1 ring-border"
                          >
                            <span className="pointer-events-none flex min-w-0 flex-1 gap-3 blur-[6px] select-none">
                              <span className="size-16 shrink-0 rounded-xl bg-muted" />
                              <span className="min-w-0 py-0.5">
                                <span className="block h-4 w-32 rounded bg-muted" />
                                <span className="mt-2 block h-3 w-24 rounded bg-muted" />
                                <span className="mt-2 block h-3 w-40 rounded bg-muted" />
                              </span>
                            </span>
                            <PurchaseLockBadge className="top-1/2 right-3 -translate-y-1/2" />
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })
            : timeline.map((section) => (
            <section key={section.key} className="mb-8">
              <h3 className="text-base font-medium">
                Day {section.dayNumber}
                <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{section.title}</span>
              </h3>
              {section.brief ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.brief}</p>
              ) : null}
              <ol className="relative mt-4">
                <span className="absolute top-3 bottom-3 left-[13px] w-px bg-border" aria-hidden />
                {section.entries.map((entry, entryIndex) => {
                  if (entry.kind === "reservation") {
                    const Icon = reservationIcons[entry.reservation.type];
                    const linked = entry.reservation.spotId
                      ? spotById(story, entry.reservation.spotId)
                      : null;
                    return (
                      <li key={`res-${entry.reservation.id}-${entryIndex}`} className="relative flex gap-3 pb-5">
                        <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background">
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1 rounded-2xl bg-card p-3 ring-1 ring-border">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Suggested {reservationLabels[entry.reservation.type].toLowerCase()}
                          </p>
                          <p className="mt-0.5 text-sm font-medium">{entry.reservation.title}</p>
                          {entry.meta ? (
                            <p className="mt-1 text-xs text-muted-foreground">{entry.meta}</p>
                          ) : null}
                          {entry.reservation.notes ? (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.reservation.notes}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3">
                            {linked ? (
                              <button
                                type="button"
                                onClick={() => setOpenId(linked.id)}
                                className="text-xs font-medium text-primary"
                              >
                                View find
                              </button>
                            ) : null}
                            {entry.reservation.link ? (
                              <a
                                href={entry.reservation.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                              >
                                Where to book
                                <ExternalLink className="size-3" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  }
                  if (entry.kind === "commute") {
                    const Icon = commuteIcons[entry.commute.mode];
                    const minutes = entry.commute.minutes ?? entry.commute.mapsMinutes ?? 0;
                    const meta = [
                      commuteModeLabel[entry.commute.mode],
                      formatCommuteMinutes(minutes),
                      entry.commute.costThb ? formatInr(entry.commute.costThb) : "",
                      formatCommuteDistance(entry.commute.mapsDistanceM),
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li key={entryIndex} className="relative flex gap-3 pb-4">
                        <span className="relative z-10 grid size-7 shrink-0 place-items-center" aria-hidden>
                          <span className="grid size-6 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border">
                            <Icon className="size-3" />
                          </span>
                        </span>
                        <div className="min-w-0 pt-1">
                          <p className="text-xs font-medium text-muted-foreground">{meta}</p>
                          {entry.commute.notes ? (
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{entry.commute.notes}</p>
                          ) : null}
                        </div>
                      </li>
                    );
                  }
                  if (entry.kind === "note") {
                    return (
                      <li key={entryIndex} className="relative flex gap-3 pb-5">
                        <span className="relative z-10 grid size-7 shrink-0 place-items-center" aria-hidden>
                          <span className="size-2.5 rounded-full bg-foreground/25" />
                        </span>
                        <p className="pt-1 text-sm leading-6 text-muted-foreground">{entry.body}</p>
                      </li>
                    );
                  }
                  return (
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
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <div className={`relative h-full min-h-0 overflow-hidden lg:border-l lg:border-border ${mode === "list" ? "hidden lg:block" : ""}`}>
          {locked ? (
            <button
              type="button"
              onClick={askPurchase}
              className="absolute inset-0 z-10 grid place-items-center bg-background/20"
              aria-label="Purchase to unlock map"
            >
              <span className="grid size-12 place-items-center rounded-full bg-white shadow-sm ring-1 ring-border">
                <Lock className="size-5" />
              </span>
            </button>
          ) : null}
          <div className={locked ? "pointer-events-none h-full blur-[6px] select-none" : "h-full"}>
            <RouteMap
              key={`${day}-${points.map((point) => point.id).join("-")}-${locked ? "locked" : "open"}`}
              points={locked ? [] : points}
              connected={!locked && day !== "overview"}
              onSelect={locked ? () => undefined : setOpenId}
            />
          </div>
        </div>
      </div>
      <SpotSheet
        spot={openSpot}
        open={openSpot !== null && !locked}
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
      <PurchaseSheet
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        storySlug={story.slug}
        kind="itinerary"
        itemId={itinerary.slug}
        title={itinerary.title}
        priceInr={itinerary.priceInr ?? 99}
        onPurchased={() => {
          setPurchaseOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function buildTimeline(
  story: Story,
  allDays: Day[],
  visibleDays: Day[],
  reservations: Reservation[],
) {
  let number = 0;
  return visibleDays.map((day) => {
    const dayIndex = allDays.indexOf(day);
    const dayReservations = reservationsForDay(reservations, dayIndex).map((item) =>
      reservationEntry(item),
    );
    const schedule = day.blocks.flatMap((block) =>
      toEntry(story, block, () => {
        number += 1;
        return number;
      }),
    );
    return {
      key: `day-${dayIndex}`,
      dayNumber: dayIndex + 1,
      title: day.title,
      brief: day.brief ?? "",
      entries: [...dayReservations, ...schedule],
    };
  });
}

type TimelineEntry =
  | { kind: "note"; body: string }
  | { kind: "commute"; commute: CommuteLeg }
  | { kind: "reservation"; reservation: Reservation; meta: string }
  | { kind: "spot"; number: number; spot: Spot; body: string; meta: string };

function reservationEntry(item: Reservation): TimelineEntry {
  const meta = [
    formatDayRange(item.fromDay, item.toDay),
    item.fromPlace && item.toPlace ? `${item.fromPlace} → ${item.toPlace}` : "",
    item.rentalKind ?? "",
    item.timeOfDay ?? "",
    item.estCostThb ? formatInr(item.estCostThb) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { kind: "reservation", reservation: item, meta };
}

function toEntry(story: Story, block: Block, nextNumber: () => number): TimelineEntry[] {
  if (block.kind === "note") return [{ kind: "note" as const, body: block.body }];
  const spot = spotById(story, block.spotId);
  if (!spot) return [];
  const meta = [spot.avgMinutes > 0 ? formatDuration(spot.avgMinutes, spot.type) : "", spot.avgCostThb > 0 ? formatCost(spot.avgCostThb, spot.type) : ""]
    .filter(Boolean)
    .join(" · ");
  const entries: TimelineEntry[] = [];
  if (block.commute) entries.push({ kind: "commute", commute: block.commute });
  entries.push({ kind: "spot" as const, number: nextNumber(), spot, body: block.body, meta });
  return entries;
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
