"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useState } from "react";

import { Loader } from "@/components/loader";
import type { StoryTab } from "@/lib/mock/studio";
import { setDeskArchived } from "@/lib/studio-desk";

export function ArchiveAction({
  storyId,
  kind,
  itemId,
  archived,
}: {
  storyId: string;
  kind: StoryTab;
  itemId: string;
  archived: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    setPending(true);
    try {
      await setDeskArchived(storyId, kind, itemId, !archived);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this");
    } finally {
      setPending(false);
    }
  }

  const label = archived ? "Restore" : "Archive";

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        aria-label={label}
        title={label}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {pending ? (
          <Loader className="size-4" />
        ) : archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
        {label}
      </button>
      <p className="text-sm text-muted-foreground">
        {archived
          ? "Archived — restore to show travelers again."
          : "Archive hides this from travelers."}
      </p>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}
