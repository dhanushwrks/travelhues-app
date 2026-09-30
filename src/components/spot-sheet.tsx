"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { ExternalLink, Navigation } from "lucide-react";

import { Loader } from "@/components/loader";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { spotTypeMeta } from "@/components/spot-type";
import { formatCost, formatDuration } from "@/lib/format";
import { unpackDescription } from "@/lib/spot-copy";
import type { Spot } from "@/lib/types";
import { MarkControls } from "@/components/mark-controls";

const PinMap = dynamic(
  () => import("@/components/maps").then((mod) => mod.PinMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-40 place-items-center bg-muted">
        <Loader className="size-5 text-primary" />
      </div>
    ),
  },
);

export function SpotSheet({
  spot,
  open,
  onOpenChange,
  storySlug = "",
  traveler = false,
  liked = false,
  saved = false,
  likes = 0,
  icons = false,
}: {
  spot: Spot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storySlug?: string;
  traveler?: boolean;
  liked?: boolean;
  saved?: boolean;
  likes?: number;
  icons?: boolean;
}) {
  const meta = spot ? spotTypeMeta[spot.type] : null;
  const copy = spot ? unpackDescription(spot.description) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] w-full max-w-none gap-0 overflow-y-auto rounded-t-3xl p-0"
      >
        {spot && meta ? (
          <>
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={spot.images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="430px"
              />
            </div>
            <div className="space-y-4 px-5 pt-4 pb-8">
              <p className={`text-sm font-medium ${meta.ink}`}>{meta.label}</p>
              <SheetTitle className="font-display text-3xl leading-tight font-medium">
                {spot.title}
              </SheetTitle>
              {storySlug ? (
                <MarkControls
                  key={spot.id}
                  traveler={traveler}
                  storySlug={storySlug}
                  kind="spot"
                  spotId={spot.id}
                  liked={liked}
                  saved={saved}
                  likes={likes}
                  icons={icons}
                />
              ) : null}
              <p className="text-[15px] leading-6 whitespace-pre-wrap">{copy?.summary}</p>
              {copy?.tips ? (
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <p className="text-sm font-medium">Tips</p>
                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{copy.tips}</p>
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {formatDuration(spot.avgMinutes, spot.type)},{" "}
                {formatCost(spot.avgCostThb, spot.type)}
              </p>
              <p className="text-sm text-muted-foreground">{spot.address}</p>
              {spot.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {spot.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="overflow-hidden rounded-2xl">
                {open ? (
                  <PinMap lng={spot.lng} lat={spot.lat} label={spot.title} />
                ) : null}
              </div>
              <div className="grid gap-2">
                <a href={directionsHref(spot)} target="_blank" rel="noopener noreferrer" className={outlineButton}>
                  <Navigation className="size-4" />
                  Get directions
                </a>
                {copy?.affiliate ? (
                  <a href={copy.affiliate} target="_blank" rel="noopener noreferrer" className={primaryButton}>
                    {spot.type === "stay" ? "Reserve here" : "Book here"}
                  </a>
                ) : null}
                {copy?.reference ? (
                  <a href={copy.reference} target="_blank" rel="noopener noreferrer" className={outlineButton}>
                    <ExternalLink className="size-4" />
                    {siteLabel(copy.reference)}
                  </a>
                ) : null}
                {extraLinks(copy?.summary ?? "", copy?.tips ?? "", [copy?.affiliate ?? "", copy?.reference ?? ""]).map(
                  (url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={outlineButton}>
                      <ExternalLink className="size-4" />
                      {siteLabel(url)}
                    </a>
                  ),
                )}
              </div>
            </div>
          </>
        ) : (
          <SheetTitle className="sr-only">Spot</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

const primaryButton =
  "flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground";
const outlineButton =
  "flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium";

function directionsHref(spot: Spot) {
  const destination = Number.isFinite(spot.lat) && Number.isFinite(spot.lng) ? `${spot.lat},${spot.lng}` : spot.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function extraLinks(summary: string, tips: string, known: string[]) {
  const skip = new Set(known.filter(Boolean));
  const found = `${summary}\n${tips}`.match(/https:\/\/\S+/gi) ?? [];
  return [...new Set(found.map((url) => url.replace(/[).,]+$/g, "")))].filter((url) => !skip.has(url));
}

function siteLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}
