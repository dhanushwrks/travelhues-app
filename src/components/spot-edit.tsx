"use client";

import { ArchiveAction } from "@/components/archive-action";
import { BackLink } from "@/components/back-link";
import { PageLoader } from "@/components/loader";
import { useDesk, useDeskHome } from "@/lib/studio-desk";

/** Find field editing is not wired yet — this screen hosts Archive/Restore for the find. */
export function SpotEdit({ storyId, spotId }: { storyId: string; spotId: string }) {
  const home = useDeskHome();
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const find = story?.spots.find((item) => item.id === spotId);
  const back = `${home}/${storyId}/spots/${spotId}`;

  if (!story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <PageLoader label="Loading the find" />
      </div>
    );
  }
  if (status === "error") {
    return <p className="px-5 pt-6 text-sm text-primary">{problem}</p>;
  }
  if (!story || !find) {
    return (
      <div className="px-5 pt-6">
        <BackLink href={`${home}/${storyId}?tab=spots`} />
        <p className="pt-6 text-sm text-muted-foreground">That find is not in this story.</p>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <BackLink href={back} />
        <h1 className="truncate text-lg font-medium">Edit find</h1>
      </div>
      <p className="text-sm text-muted-foreground">{find.title}</p>
      <ArchiveAction
        storyId={storyId}
        kind="spots"
        itemId={spotId}
        archived={find.archived ?? false}
      />
    </div>
  );
}
