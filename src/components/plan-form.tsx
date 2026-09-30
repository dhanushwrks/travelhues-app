"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ArchiveAction } from "@/components/archive-action";
import { Loader, PageLoader } from "@/components/loader";
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
import { createDeskPlan, updateDeskPlan, useDesk, useDeskHome } from "@/lib/studio-desk";

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3";

export function PlanForm({
  storyId,
  planId,
  resume = false,
}: {
  storyId: string;
  planId?: string;
  resume?: boolean;
}) {
  const router = useRouter();
  const home = useDeskHome();
  const trip = home === "/trips";
  const { stories, status } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const existing = planId ? story?.plans.find((item) => item.id === planId) : undefined;
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
  const [loadedPlan, setLoadedPlan] = useState<string | null>(null);
  if (!planId && draft && appliedDraft !== draft) {
    setAppliedDraft(draft);
    setTitle(draft.title);
    setSummary(draft.summary);
    setImages(draft.images);
    setDays(draft.days.length > 0 ? draft.days : [{ id: "day-1", title: "", blocks: [] }]);
    setActive(Math.min(draft.active, Math.max(draft.days.length - 1, 0)));
  }
  if (planId && resume && draft && appliedDraft !== draft) {
    setAppliedDraft(draft);
    setLoadedPlan(planId);
    setTitle(draft.title);
    setSummary(draft.summary);
    setImages(draft.images);
    setDays(draft.days.length > 0 ? draft.days : [{ id: "day-1", title: "", blocks: [] }]);
    setActive(Math.min(draft.active, Math.max(draft.days.length - 1, 0)));
  }
  if (planId && !resume && existing && loadedPlan !== existing.id) {
    setLoadedPlan(existing.id);
    setTitle(existing.title);
    setSummary(existing.summary);
    setImages(existing.images);
    setDays(existing.days.length > 0 ? existing.days : [{ id: "day-1", title: "", blocks: [] }]);
    setActive(0);
  }
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const day = days[active] ?? days[0];
  const back = planId ? `${home}/${storyId}/plans/${planId}` : `${home}/${storyId}?tab=plans`;

  if (planId && (!mounted || (!existing && !resume))) {
    return (
      <div className="px-5 pt-6">
        <Link href={`${home}/${storyId}?tab=plans`} className="text-sm font-medium">
          ←
        </Link>
        {status === "ready" ? (
          <p className="pt-6 text-sm text-muted-foreground">
            {trip ? "That itinerary is not in this trip." : "That plan is not in this story."}
          </p>
        ) : (
          <PageLoader label={trip ? "Loading the itinerary" : "Loading the plan"} />
        )}
      </div>
    );
  }

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

  function onDragEnd(event: DragEndEvent) {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;
    const from = day.blocks.findIndex((block) => block.id === dragged.id);
    const to = day.blocks.findIndex((block) => block.id === over.id);
    if (from < 0 || to < 0) return;
    updateDay(active, { ...day, blocks: arrayMove(day.blocks, from, to) });
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
      const saved = {
        title: title.trim(),
        summary: summary.trim(),
        images,
        days: days.map((item) => ({ ...item, title: item.title.trim() })),
      };
      if (planId) await updateDeskPlan(storyId, planId, saved);
      else await createDeskPlan(storyId, saved);
      router.push(planId ? `${home}/${storyId}/plans/${planId}` : `${home}/${storyId}?tab=plans`);
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : trip ? "Could not save the itinerary" : "Could not save the plan");
    }
  }

  return (
    <form onSubmit={save} className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm font-medium" aria-label="Story">
          ←
        </Link>
        <h1 className="text-lg font-medium">
          {planId ? (trip ? "Edit itinerary" : "Edit plan") : trip ? "New itinerary" : "New plan"}
        </h1>
      </div>
      <p className="text-sm leading-6">
        {trip ? (
          <>
            <span className="font-medium">What is an itinerary?</span> The days, in order. Each day has a title and a
            schedule: a note, or a spot you already added to this trip.
          </>
        ) : (
          <>
            <span className="font-medium">What is a plan?</span> The days, in order. Each day has a title and a schedule:
            a note, or a spot already in this story.
          </>
        )}
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
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">Schedule</span>
          {day.blocks.length > 1 ? (
            <span className="text-xs text-muted-foreground">Drag to reorder</span>
          ) : null}
        </div>
        {day.blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing on this day yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={day.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <ul className="grid gap-3">
                {day.blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    spots={spots}
                    onRemove={() =>
                      updateDay(active, { ...day, blocks: day.blocks.filter((item) => item.id !== block.id) })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
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
            router.push(
              planId
                ? `${home}/${storyId}/spots/new?from=plan&plan=${planId}`
                : `${home}/${storyId}/spots/new?from=plan`,
            );
          }}
        />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {planId && existing ? (
        <ArchiveAction
          storyId={storyId}
          kind="plans"
          itemId={planId}
          archived={existing.archived ?? false}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href={back} className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader label="Saving" /> : planId ? "Save plan" : "Create plan"}
        </button>
      </div>
    </form>
  );
}

function SortableBlock({
  block,
  spots,
  onRemove,
}: {
  block: PlanBlock;
  spots: StorySpot[];
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const spot = block.kind === "stop" ? spots.find((item) => item.id === block.spotId) : null;
  const kindLabel = block.kind === "note" ? "note" : "spot";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "z-10 opacity-90" : undefined}
    >
      <article
        className={`overflow-hidden rounded-2xl bg-secondary ${
          isDragging ? "shadow-[0_12px_32px_rgba(18,35,42,0.16)] ring-2 ring-primary/25" : ""
        }`}
      >
        {spot?.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spot.images[0]} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : null}
        <div className="flex gap-2 px-2 py-3 text-sm">
          <button
            type="button"
            aria-label="Drag to reorder"
            disabled={confirming}
            className="mt-0.5 touch-none self-start rounded-lg p-1.5 text-muted-foreground hover:bg-background/60 hover:text-foreground disabled:opacity-40"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          <div className="grid min-w-0 flex-1 gap-2 pr-1">
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
            {confirming ? (
              <div className="grid gap-2 rounded-xl bg-background/70 px-3 py-2.5">
                <p className="text-sm leading-5">Remove this {kindLabel} from the day?</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted-foreground">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      onRemove();
                    }}
                    className="text-sm font-medium text-primary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="justify-self-start text-sm text-muted-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
