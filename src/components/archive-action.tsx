"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useEffect, useState } from "react";

import { Loader } from "@/components/loader";
import type { StoryTab } from "@/lib/mock/studio";
import { setDeskArchived } from "@/lib/studio-desk";

export function ArchiveAction({
  storyId,
  kind,
  itemId,
  archived,
  compact = false,
}: {
  storyId: string;
  kind: StoryTab | "story";
  itemId: string;
  archived: boolean;
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, pending]);

  async function toggle() {
    setError("");
    setPending(true);
    try {
      await setDeskArchived(storyId, kind, itemId, !archived);
      setConfirmOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this");
      setConfirmOpen(false);
    } finally {
      setPending(false);
    }
  }

  const label = archived ? "Restore" : "Archive";
  const confirmTitle = archived ? "Restore this?" : "Archive this?";
  const confirmBody = archived
    ? "Travelers will be able to see this again."
    : "Archive hides this from travelers until you restore it.";

  return (
    <div className={compact ? "grid gap-1" : "grid gap-2"}>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        aria-label={label}
        title={
          archived
            ? "Archived — restore to show travelers again."
            : "Archive hides this from travelers."
        }
        className={
          compact
            ? "inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-60"
            : "inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
        }
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
      {!compact ? (
        <p className="text-sm text-muted-foreground">
          {archived
            ? "Archived — restore to show travelers again."
            : "Archive hides this from travelers."}
        </p>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
          role="presentation"
          onClick={() => {
            if (!pending) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-confirm-title"
            className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-1">
              <h4 id="archive-confirm-title" className="font-display text-2xl">
                {confirmTitle}
              </h4>
              <p className="text-sm text-muted-foreground">{confirmBody}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full border border-border py-3 text-sm font-medium disabled:opacity-60"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={pending}
                onClick={() => void toggle()}
              >
                {pending ? <Loader label={archived ? "Restoring" : "Archiving"} /> : label}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
