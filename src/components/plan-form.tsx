"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";

import { Loader } from "@/components/loader";
import { formatInr } from "@/lib/format";
import { PictureTray } from "@/components/picture-tray";
import { SpotPicker } from "@/components/spot-picker";
import {
  categoryName,
  clearPlanDraft,
  nextPieceId,
  planDraftServerSnapshot,
  planDraftSnapshot,
  subscribeStudio,
  writePlanDraft,
  type PlanBlock,
  type PlanDay,
  type PlanDraft,
  type StorySpot,
} from "@/lib/mock/studio";
import { createDeskPlan, useDesk } from "@/lib/studio-desk";

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3";

export function PlanForm({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { stories } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const spots = story?.spots ?? [];

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [days, setDays] = useState<PlanDay[]>([{ id: "day-1", title: "", blocks: [] }]);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState<"note" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const draft = useSyncExternalStore(
    subscribeStudio,
    () => planDraftSnapshot(storyId),
    planDraftServerSnapshot,
  );
  const [appliedDraft, setAppliedDraft] = useState<PlanDraft | null>(null);
  if (draft && appliedDraft !== draft) {
    setAppliedDraft(draft);
    setTitle(draft.title);
    setSummary(draft.summary);
    setImages(draft.images);
    setDays(draft.days.length > 0 ? draft.days : [{ id: "day-1", title: "", blocks: [] }]);
    setActive(Math.min(draft.active, Math.max(draft.days.length - 1, 0)));
  }
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const day = days[active] ?? days[0];

  function updateDay(index: number, next: PlanDay) {
    setDays(days.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function addNote() {
    if (note.trim().length < 8) {
      setError("Write the note");
      return;
    }
    setError("");
    updateDay(active, {
      ...day,
      blocks: [...day.blocks, { id: nextPieceId("note"), kind: "note", body: note.trim(), minutes: minutes.trim() }],
    });
    setNote("");
    setMinutes("");
    setAdding(null);
  }

  function addStop(spotId: string) {
    updateDay(active, {
      ...day,
      blocks: [...day.blocks, { id: nextPieceId("stop"), kind: "stop", spotId }],
    });
    setAdding(null);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= day.blocks.length) return;
    const blocks = [...day.blocks];
    const [item] = blocks.splice(index, 1);
    blocks.splice(next, 0, item);
    updateDay(active, { ...day, blocks });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a name");
      return;
    }
    if (summary.trim().length < 20) {
      setError("About needs at least a sentence");
      return;
    }
    if (days.some((item) => !item.title.trim())) {
      setError("Each day needs a title");
      return;
    }
    if (days.some((item) => item.title.trim().length > 150)) {
      setError("A day title can be 150 characters");
      return;
    }
    if (days.every((item) => item.blocks.length === 0)) {
      setError("Add a note or a spot to the schedule");
      return;
    }
    setError("");
    setSaving(true);
    clearPlanDraft(storyId);
    try {
      await createDeskPlan(storyId, {
        title: title.trim(),
        summary: summary.trim(),
        images,
        days: days.map((item) => ({ ...item, title: item.title.trim() })),
      });
      router.push(`/studio/${storyId}?tab=plans`);
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the plan");
    }
  }

  return (
    <form onSubmit={save} className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/studio/${storyId}?tab=plans`} className="text-sm font-medium" aria-label="Story">
          ←
        </Link>
        <h1 className="text-lg font-medium">New plan</h1>
      </div>
      <p className="text-sm leading-6">
        <span className="font-medium">What is a plan?</span> The days, in order. Each day has a title and a schedule:
        a note, or a spot already in this story.
      </p>
      <PictureTray images={images} onChange={setImages} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name of the route" className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">About it</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={4}
          placeholder="Who this route is for, and the shape of the days"
          className={field}
        />
      </label>
      <div className="grid gap-2">
        <span className="text-sm font-medium">Days</span>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={index === active}
              onClick={() => {
                setActive(index);
                setAdding(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                index === active ? "bg-foreground text-background" : "bg-secondary text-foreground"
              }`}
            >
              Day {index + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...days, { id: nextPieceId("day"), title: "", blocks: [] }];
              setDays(next);
              setActive(next.length - 1);
              setAdding(null);
            }}
            className="shrink-0 rounded-full border border-dashed border-foreground/30 px-4 py-2 text-sm"
          >
            + Day
          </button>
        </div>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="flex items-baseline justify-between">
          <span className="font-medium">Day title</span>
          <span className="text-muted-foreground">{day.title.length}/150</span>
        </span>
        <input
          value={day.title}
          maxLength={150}
          onChange={(event) => updateDay(active, { ...day, title: event.target.value })}
          placeholder="Title of the day"
          className={field}
        />
      </label>
      {days.length > 1 ? (
        <button
          type="button"
          onClick={() => {
            const next = days.filter((_, index) => index !== active);
            setDays(next);
            setActive(Math.max(0, active - 1));
          }}
          className="w-fit text-sm text-muted-foreground"
        >
          Remove this day
        </button>
      ) : null}
      <div className="grid gap-3">
        <span className="text-sm font-medium">Schedule</span>
        {day.blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing on this day yet.</p>
        ) : (
          <ul className="grid gap-3">
            {day.blocks.map((block, index) => (
              <li key={block.id}>
                <BlockCard
                  block={block}
                  spots={spots}
                  onRemove={() => updateDay(active, { ...day, blocks: day.blocks.filter((item) => item.id !== block.id) })}
                  onUp={() => moveBlock(index, -1)}
                  onDown={() => moveBlock(index, 1)}
                  upDisabled={index === 0}
                  downDisabled={index === day.blocks.length - 1}
                />
              </li>
            ))}
          </ul>
        )}
        {adding === "note" ? (
          <div className="grid gap-2 rounded-2xl bg-secondary p-3">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="A note for this part of the day"
              className={field}
            />
            <input
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              placeholder="How long, if it matters"
              className={field}
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setAdding(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <button type="button" onClick={addNote} className="text-sm font-medium text-primary">
                Add note
              </button>
            </div>
          </div>
        ) : null}
        {adding === null ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setAdding("note")} className="rounded-full border border-border py-3 text-sm font-medium">
              Add a note
            </button>
            <button type="button" onClick={() => setPickerOpen(true)} className="rounded-full border border-border py-3 text-sm font-medium">
              Add a spot
            </button>
          </div>
        ) : null}
        <SpotPicker
          open={pickerOpen}
          spots={spots}
          onOpenChange={setPickerOpen}
          onAdd={addStop}
          onCreate={() => {
            writePlanDraft(storyId, { title, summary, images, days, active });
            router.push(`/studio/${storyId}/spots/new?from=plan`);
          }}
        />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/studio/${storyId}?tab=plans`} className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader label="Saving" /> : "Create plan"}
        </button>
      </div>
    </form>
  );
}

function BlockCard({
  block,
  spots,
  onRemove,
  onUp,
  onDown,
  upDisabled,
  downDisabled,
}: {
  block: PlanBlock;
  spots: StorySpot[];
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}) {
  const spot = block.kind === "stop" ? spots.find((item) => item.id === block.spotId) : null;
  return (
    <article className="overflow-hidden rounded-2xl bg-secondary">
      {spot?.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={spot.images[0]} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : null}
      <div className="grid gap-2 px-3 py-3 text-sm">
        {block.kind === "note" ? (
          <>
            <p className="leading-6">{block.body}</p>
            {block.minutes ? <p className="text-muted-foreground">{block.minutes}</p> : null}
          </>
        ) : (
          <>
            <p className="font-medium">{spot?.title ?? "Spot removed"}</p>
            {spot ? (
              <p className="text-muted-foreground">
                {categoryName(spot.category)}
                {spot.duration ? ` · ${spot.duration}` : ""}
                {spot.cost ? ` · ${formatInr(Number(spot.cost))}` : ""}
              </p>
            ) : null}
          </>
        )}
        <div className="flex items-center gap-3 text-muted-foreground">
          <button type="button" aria-label="Move up" disabled={upDisabled} onClick={onUp} className="disabled:opacity-30">
            <ChevronUp className="size-4" />
          </button>
          <button type="button" aria-label="Move down" disabled={downDisabled} onClick={onDown} className="disabled:opacity-30">
            <ChevronDown className="size-4" />
          </button>
          <button type="button" onClick={onRemove} className="ml-auto text-sm">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
