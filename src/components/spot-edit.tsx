"use client";

import Link from "next/link";

import { ArchiveAction } from "@/components/archive-action";
import { PageLoader } from "@/components/loader";
import { useDesk, useDeskHome } from "@/lib/studio-desk";

/** Spot field editing is not wired yet — this screen hosts Archive/Restore for the spot. */
export function SpotEdit({ storyId, spotId }: { storyId: string; spotId: string }) {
  const home = useDeskHome();
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const spot = story?.spots.find((item) => item.id === spotId);
  const back = `${home}/${storyId}/spots/${spotId}`;

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <PageLoader label="Loading the spot" />
      </div>
    );
  }
  if (status === "error") {
    return <p className="px-5 pt-6 text-sm text-primary">{problem}</p>;
  }
  if (!story || !spot) {
    return (
      <div className="px-5 pt-6">
        <Link href={`${home}/${storyId}?tab=spots`} className="text-sm font-medium">
          ←
        </Link>
        <p className="pt-6 text-sm text-muted-foreground">That spot is not in this story.</p>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm font-medium" aria-label="Back">
          ←
        </Link>
        <h1 className="truncate text-lg font-medium">Edit spot</h1>
      </div>
      <p className="text-sm text-muted-foreground">{spot.title}</p>
      <ArchiveAction
        storyId={storyId}
        kind="spots"
        itemId={spotId}
        archived={spot.archived ?? false}
      />
    </div>
  );
}
