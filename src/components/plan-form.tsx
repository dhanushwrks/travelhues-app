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
import { GripVertical, Mountain, Pencil, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { ArchiveAction } from "@/components/archive-action";
import { BackLink } from "@/components/back-link";
import { Loader, PageLoader } from "@/components/loader";
import { estimateCommuteLeg } from "@/components/maps";
import { PictureTray } from "@/components/picture-tray";
import {
  AddItemHereMenu,
  CommuteBridge,
  ReservationComposer,
  ReservationListCard,
} from "@/components/plan-schedule";
import { SpotPicker } from "@/components/spot-picker";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatInr } from "@/lib/format";
import {
  categoryName,
  clearPlanDraft,
  nextPieceId,
  planDraftServerSnapshot,
  planDraftSnapshot,
  subscribeStudio,
  writePlanDraft,
  type PlanBlock,
  type PlanCommute,
  type PlanDay,
  type PlanDraft,
  type PlanReservation,
  type PlanStop,
  type StorySpot,
} from "@/lib/mock/studio";
import { createDeskPlan, updateDeskPlan, useDesk, useDeskHome } from "@/lib/studio-desk";

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3";

function priorStopSpotId(blocks: PlanBlock[], beforeIndex: number) {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (block?.kind === "stop") return block.spotId;
  }
  return null;
}

async function commutePatchesAfterReorder(
  before: PlanBlock[],
  after: PlanBlock[],
  spots: StorySpot[],
) {
  const patches = new Map<string, PlanCommute | "clear">();
  const beforeIndex = new Map(before.map((block, index) => [block.id, index]));

  for (let index = 0; index < after.length; index += 1) {
    const block = after[index];
    if (block.kind !== "stop" || !block.commute) continue;

    const nextPrior = priorStopSpotId(after, index);
    const oldIndex = beforeIndex.get(block.id);
    const prevPrior = oldIndex == null ? null : priorStopSpotId(before, oldIndex);

    if (nextPrior == null) {
      patches.set(block.id, "clear");
      continue;
    }
    if (nextPrior === prevPrior) continue;
    if (block.commute.mode === "flight") continue;

    const fromSpot = spots.find((spot) => spot.id === nextPrior);
    const toSpot = spots.find((spot) => spot.id === block.spotId);
    const kept = {
      mode: block.commute.mode,
      notes: block.commute.notes,
      cost: block.commute.cost,
      minutes: "",
    } satisfies PlanCommute;

    if (
      fromSpot?.lat == null ||
      fromSpot?.lng == null ||
      toSpot?.lat == null ||
      toSpot?.lng == null
    ) {
      patches.set(block.id, kept);
      continue;
    }

    const estimate = await estimateCommuteLeg(
      { lat: fromSpot.lat, lng: fromSpot.lng },
      { lat: toSpot.lat, lng: toSpot.lng },
      block.commute.mode,
    );
    patches.set(
      block.id,
      estimate
        ? {
            ...block.commute,
            minutes: String(estimate.minutes),
            mapsMinutes: estimate.minutes,
            mapsDistanceM: estimate.distanceM,
            minutesSource: "maps",
          }
        : kept,
    );
  }

  return patches;
}

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
  const trip = home === "/plans";
  const { stories, status } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const existing = planId ? story?.plans.find((item) => item.id === planId) : undefined;
  const spots = story?.spots ?? [];

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [days, setDays] = useState<PlanDay[]>([{ id: "day-1", title: "", brief: "", blocks: [] }]);
  const [reservations, setReservations] = useState<PlanReservation[]>([]);
  const [active, setActive] = useState(0);
  const [addingReservation, setAddingReservation] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [pendingCommuteStopId, setPendingCommuteStopId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [noteInsertOpen, setNoteInsertOpen] = useState(false);
  const draft = useSyncExternalStore(
    subscribeStudio,
    () => planDraftSnapshot(storyId),
    planDraftServerSnapshot,
  );
  const [appliedDraft, setAppliedDraft] = useState<PlanDraft | null>(null);
  const [loadedPlan, setLoadedPlan] = useState<string | null>(null);

  function applyDraft(next: PlanDraft) {
    setTitle(next.title);
    setSummary(next.summary);
    setImages(next.images);
    setDays(
      next.days.length > 0
        ? next.days.map((item) => ({ ...item, brief: item.brief ?? "" }))
        : [{ id: "day-1", title: "", brief: "", blocks: [] }],
    );
    setReservations(next.reservations ?? []);
    setActive(Math.min(next.active, Math.max(next.days.length - 1, 0)));
  }

  if (!planId && draft && appliedDraft !== draft) {
    setAppliedDraft(draft);
    applyDraft(draft);
  }
  if (planId && resume && draft && appliedDraft !== draft) {
    setAppliedDraft(draft);
    setLoadedPlan(planId);
    applyDraft(draft);
  }
  if (planId && !resume && existing && loadedPlan !== existing.id) {
    setLoadedPlan(existing.id);
    setTitle(existing.title);
    setSummary(existing.summary);
    setImages(existing.images);
    setDays(
      existing.days.length > 0
        ? existing.days.map((item) => ({ ...item, brief: item.brief ?? "" }))
        : [{ id: "day-1", title: "", brief: "", blocks: [] }],
    );
    setReservations(existing.reservations ?? []);
    setActive(0);
  }
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState("");
  const [noteError, setNoteError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!confirmSaveOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) setConfirmSaveOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmSaveOpen, saving]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const day = days[active] ?? days[0];
  const back = planId ? `${home}/${storyId}/plans/${planId}` : `${home}/${storyId}?tab=plans`;
  const reservationSheetOpen = addingReservation || editingReservationId !== null;
  const editingReservation = reservations.find((item) => item.id === editingReservationId);

  function closeReservationSheet() {
    setAddingReservation(false);
    setEditingReservationId(null);
  }

  function openCreateFind(category: "stay" | "rental") {
    writePlanDraft(storyId, draftSnapshot());
    router.push(
      planId
        ? `${home}/${storyId}/spots/new?from=plan&plan=${planId}&category=${category}`
        : `${home}/${storyId}/spots/new?from=plan&category=${category}`,
    );
  }

  if (planId && (!mounted || (!existing && !resume))) {
    return (
      <div className="px-5 pt-6">
        <BackLink href={`${home}/${storyId}?tab=plans`} />
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

  function patchBlock(blockId: string, patch: PlanBlock) {
    updateDay(active, {
      ...day,
      blocks: day.blocks.map((block) => (block.id === blockId ? patch : block)),
    });
  }

  function previousStop(beforeIndex: number): PlanStop | null {
    for (let index = beforeIndex - 1; index >= 0; index -= 1) {
      const block = day.blocks[index];
      if (block?.kind === "stop") return block;
    }
    return null;
  }

  function draftSnapshot(): PlanDraft {
    return { title, summary, images, days, reservations, active };
  }

  function addStop(spotId: string) {
    const hadPriorStop = day.blocks.some((block) => block.kind === "stop");
    const stopId = nextPieceId("stop");
    const stop = { id: stopId, kind: "stop" as const, spotId };
    if (insertAt != null) {
      const next = [...day.blocks];
      next.splice(insertAt, 0, stop);
      updateDay(active, { ...day, blocks: next });
      setInsertAt(null);
      const priorExists = next.slice(0, insertAt).some((block) => block.kind === "stop");
      if (priorExists) setPendingCommuteStopId(stopId);
      return;
    }
    updateDay(active, {
      ...day,
      blocks: [...day.blocks, stop],
    });
    if (hadPriorStop) setPendingCommuteStopId(stopId);
  }

  function insertNoteAt(index: number) {
    setInsertAt(index);
    setNote("");
    setMinutes("");
    setNoteError("");
    setNoteInsertOpen(true);
  }

  function commitInsertedNote() {
    if (note.trim().length < 8) {
      setNoteError("Write a bit more for the note");
      return;
    }
    if (insertAt == null) return;
    setNoteError("");
    const next = [...day.blocks];
    next.splice(insertAt, 0, {
      id: nextPieceId("note"),
      kind: "note",
      body: note.trim(),
      minutes: minutes.trim(),
    });
    updateDay(active, { ...day, blocks: next });
    setNote("");
    setMinutes("");
    setInsertAt(null);
    setNoteInsertOpen(false);
  }

  function openInsertSpot(index: number) {
    setInsertAt(index);
    setPickerOpen(true);
  }

  function saveReservation(reservation: Omit<PlanReservation, "id">) {
    if (editingReservationId) {
      setReservations((items) =>
        items.map((item) => (item.id === editingReservationId ? { ...reservation, id: item.id } : item)),
      );
    } else {
      setReservations((items) => [...items, { ...reservation, id: nextPieceId("reservation") }]);
    }
    closeReservationSheet();
  }

  function onDragEnd(event: DragEndEvent) {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;
    const from = day.blocks.findIndex((block) => block.id === dragged.id);
    const to = day.blocks.findIndex((block) => block.id === over.id);
    if (from < 0 || to < 0) return;
    const previous = day.blocks;
    const moved = arrayMove(previous, from, to);
    const dayIndex = active;
    updateDay(dayIndex, { ...day, blocks: moved });
    void (async () => {
      const patches = await commutePatchesAfterReorder(previous, moved, spots);
      if (patches.size === 0) return;
      setDays((current) =>
        current.map((item, index) => {
          if (index !== dayIndex) return item;
          return {
            ...item,
            blocks: item.blocks.map((block) => {
              const patch = patches.get(block.id);
              if (!patch || block.kind !== "stop") return block;
              if (patch === "clear") {
                const { commute: _removed, ...rest } = block;
                return rest;
              }
              return { ...block, commute: patch };
            }),
          };
        }),
      );
    })();
  }

  function save(event: FormEvent) {
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
    if (days.every((item) => item.blocks.length === 0) && reservations.length === 0) {
      setError("Add a note, find, or reservation suggestion");
      return;
    }
    setError("");
    setConfirmSaveOpen(true);
  }

  async function commitSave() {
    setSaving(true);
    clearPlanDraft(storyId);
    try {
      const saved = {
        title: title.trim(),
        summary: summary.trim(),
        images,
        days: days.map((item) => ({ ...item, title: item.title.trim() })),
        reservations: reservations.map((item) => ({
          ...item,
          fromDay: Math.min(item.fromDay, days.length - 1),
          toDay: Math.min(Math.max(item.toDay, item.fromDay), days.length - 1),
        })),
      };
      let savedId = planId;
      if (planId) await updateDeskPlan(storyId, planId, saved);
      else savedId = await createDeskPlan(storyId, saved);
      setConfirmSaveOpen(false);
      router.push(`${home}/${storyId}/plans/${savedId}`);
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setConfirmSaveOpen(false);
      setError(caught instanceof Error ? caught.message : trip ? "Could not save the itinerary" : "Could not save the plan");
    }
  }

  return (
    <>
    <form
      ref={formRef}
      onSubmit={save}
      className="mx-auto grid h-full max-w-2xl gap-5 overflow-y-auto px-5 pt-5 pb-6"
    >
      <div className="flex items-center gap-3">
        <BackLink href={back} label="Story" />
        <h1 className="min-w-0 flex-1 text-lg font-medium">
          {planId ? (trip ? "Edit itinerary" : "Edit plan") : trip ? "New itinerary" : "New plan"}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {planId && existing ? (
            <ArchiveAction
              storyId={storyId}
              kind="plans"
              itemId={planId}
              archived={existing.archived ?? false}
              compact
            />
          ) : null}
          <button
            type="button"
            aria-label={planId ? "Save plan" : "Create plan"}
            disabled={saving}
            onClick={() => formRef.current?.requestSubmit()}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader className="size-4" /> : <Save className="size-4" />}
            {planId ? "Save" : "Create"}
          </button>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Suggest stays, rentals, and flights for the trip, then line up each day’s finds and how to move between them.
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

      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Reservations</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Suggest reservations for viewers
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingReservationId(null);
              setAddingReservation(true);
            }}
            className="shrink-0 text-sm font-medium text-primary"
          >
            + add
          </button>
        </div>
        {reservations.length === 0 ? (
          <p className="rounded-2xl bg-secondary/60 px-4 py-5 text-center text-sm text-muted-foreground">
            No suggestions yet. Add a stay, rental, or flight for this itinerary.
          </p>
        ) : (
          <ul className="grid gap-2">
            {reservations.map((item) => (
              <li key={item.id}>
                <ReservationListCard
                  item={item}
                  spotTitle={spots.find((spot) => spot.id === item.spotId)?.title}
                  onEdit={() => {
                    setAddingReservation(false);
                    setEditingReservationId(item.id);
                  }}
                  onRemove={() => setReservations((items) => items.filter((entry) => entry.id !== item.id))}
                />
              </li>
            ))}
          </ul>
        )}
        <Sheet
          open={reservationSheetOpen}
          onOpenChange={(open) => {
            if (!open) closeReservationSheet();
          }}
        >
          <SheetContent
            side="bottom"
            className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
          >
            <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
              <SheetTitle className="text-lg font-medium">
                {editingReservation ? "Edit suggestion" : "Suggest a reservation"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                Shown to viewers on the days you pick
              </SheetDescription>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {reservationSheetOpen ? (
                <ReservationComposer
                  key={editingReservation?.id ?? "new"}
                  initial={editingReservation}
                  dayCount={days.length}
                  spots={spots}
                  plain
                  onCancel={closeReservationSheet}
                  onSave={saveReservation}
                  onCreateFind={openCreateFind}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </section>

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
                setPendingCommuteStopId(null);
                setNoteInsertOpen(false);
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
              const next = [...days, { id: nextPieceId("day"), title: "", brief: "", blocks: [] }];
              setDays(next);
              setActive(next.length - 1);
              setPendingCommuteStopId(null);
              setNoteInsertOpen(false);
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
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Day brief</span>
        <textarea
          value={day.brief ?? ""}
          onChange={(event) => updateDay(active, { ...day, brief: event.target.value })}
          rows={3}
          placeholder="A short note for this day — pace, focus, what to expect"
          className={field}
        />
      </label>
      {days.length > 1 ? (
        <button
          type="button"
          onClick={() => {
            const removed = active;
            const next = days.filter((_, index) => index !== removed);
            setDays(next);
            setActive(Math.max(0, active - 1));
            setReservations((items) =>
              items.map((item) => {
                const shift = (value: number) => (value > removed ? value - 1 : value === removed ? Math.max(0, value - 1) : value);
                const fromDay = Math.min(shift(item.fromDay), next.length - 1);
                const toDay = Math.min(Math.max(shift(item.toDay), fromDay), next.length - 1);
                return { ...item, fromDay, toDay };
              }),
            );
          }}
          className="w-fit text-sm text-muted-foreground"
        >
          Remove this day
        </button>
      ) : null}

      {reservations.some((item) => item.fromDay <= active && item.toDay >= active) ? (
        <div className="grid gap-2 rounded-2xl bg-secondary/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            On this day
          </p>
          <ul className="grid gap-2">
            {reservations
              .filter((item) => item.fromDay <= active && item.toDay >= active)
              .map((item) => (
                <li key={item.id} className="text-sm">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · suggested {item.type}
                    {item.fromDay !== item.toDay ? ` · Day ${item.fromDay + 1}–${item.toDay + 1}` : ""}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">Schedule</span>
          {day.blocks.length > 1 ? (
            <span className="text-xs text-muted-foreground">Drag to reorder</span>
          ) : null}
        </div>
        {day.blocks.length === 0 ? (
          <p className="rounded-2xl bg-secondary/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing on this day yet. Add a find or a note.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={day.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <ul className="grid gap-1">
                {day.blocks.map((block, index) => {
                  const prior = previousStop(index);
                  const showCommute =
                    block.kind === "stop" &&
                    (prior != null || block.commute || pendingCommuteStopId === block.id);
                  const fromSpot = prior ? spots.find((item) => item.id === prior.spotId) : null;
                  const toSpot = block.kind === "stop" ? spots.find((item) => item.id === block.spotId) : null;

                  return (
                    <li key={block.id} className="grid gap-1">
                      {showCommute && block.kind === "stop" ? (
                        <CommuteBridge
                          commute={block.commute}
                          defaultOpen={pendingCommuteStopId === block.id}
                          fromLabel={fromSpot?.title ?? "Previous stop"}
                          toLabel={toSpot?.title ?? "This stop"}
                          fromSpot={fromSpot}
                          toSpot={toSpot}
                          onChange={(commute: PlanCommute) => {
                            patchBlock(block.id, { ...block, commute });
                            setPendingCommuteStopId(null);
                          }}
                          onClear={() => {
                            const { commute: _removed, ...rest } = block;
                            patchBlock(block.id, rest);
                            setPendingCommuteStopId(null);
                          }}
                          onDismiss={() => setPendingCommuteStopId(null)}
                          onAddText={() => insertNoteAt(index)}
                          onAddSpot={() => openInsertSpot(index)}
                        />
                      ) : index > 0 ? (
                        <div className="relative flex flex-wrap items-center gap-2 py-1 pl-1">
                          <span className="ml-[18px] h-6 w-px bg-border" aria-hidden />
                          <AddItemHereMenu
                            onText={() => insertNoteAt(index)}
                            onSpot={() => openInsertSpot(index)}
                          />
                        </div>
                      ) : null}
                      <SortableBlock
                        block={block}
                        spots={spots}
                        onRemove={() =>
                          updateDay(active, {
                            ...day,
                            blocks: day.blocks.filter((item) => item.id !== block.id),
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <div className="grid gap-2">
          <p className="text-sm font-medium">Add an item to day’s schedule</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => insertNoteAt(day.blocks.length)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium"
            >
              <Pencil className="size-4" />
              Text
            </button>
            <button
              type="button"
              onClick={() => {
                setInsertAt(null);
                setPickerOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium"
            >
              <Mountain className="size-4" />
              Add a Spot
            </button>
          </div>
        </div>
        <SpotPicker
          open={pickerOpen}
          spots={spots}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) setInsertAt(null);
          }}
          onAdd={addStop}
          onCreate={() => {
            writePlanDraft(storyId, draftSnapshot());
            router.push(
              planId
                ? `${home}/${storyId}/spots/new?from=plan&plan=${planId}`
                : `${home}/${storyId}/spots/new?from=plan`,
            );
          }}
        />
        <Sheet
          open={noteInsertOpen}
          onOpenChange={(open) => {
            setNoteInsertOpen(open);
            if (!open) {
              setInsertAt(null);
              setNote("");
              setMinutes("");
              setNoteError("");
            }
          }}
        >
          <SheetContent
            side="bottom"
            className="flex max-h-[70dvh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
          >
            <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
              <SheetTitle className="text-lg font-medium">Add a note</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                {insertAt != null && insertAt < day.blocks.length
                  ? "Inserts into this spot in the day"
                  : "Adds to the end of this day"}
              </SheetDescription>
            </div>
            <div className="grid gap-3 px-5 py-4">
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  if (noteError) setNoteError("");
                }}
                rows={4}
                placeholder="A note for this part of the day"
                className={field}
              />
              <input
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                placeholder="How long, if it matters"
                className={field}
              />
              {noteError ? <p className="text-sm text-primary">{noteError}</p> : null}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNoteInsertOpen(false)}
                  className="rounded-full border border-border py-3 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitInsertedNote}
                  className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
                >
                  Add note
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
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
    {confirmSaveOpen ? (
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
        role="presentation"
        onClick={() => {
          if (!saving) setConfirmSaveOpen(false);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-save-confirm-title"
          className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid gap-1">
            <h4 id="plan-save-confirm-title" className="font-display text-2xl">
              {planId ? (trip ? "Save itinerary?" : "Save plan?") : trip ? "Create itinerary?" : "Create plan?"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {planId
                ? "This updates the plan for viewers with your current days, finds, and suggestions."
                : "This publishes the plan to the story with your current days, finds, and suggestions."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-full border border-border py-3 text-sm font-medium disabled:opacity-60"
              disabled={saving}
              onClick={() => setConfirmSaveOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={saving}
              onClick={() => void commitSave()}
            >
              {saving ? (
                <Loader label="Saving" />
              ) : planId ? (
                "Save"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
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
  const find = block.kind === "stop" ? spots.find((item) => item.id === block.spotId) : null;
  const kindLabel = block.kind === "note" ? "note" : "find";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "z-10 opacity-90" : undefined}
    >
      <article
        className={`rounded-2xl bg-secondary ${
          isDragging ? "shadow-[0_12px_32px_rgba(18,35,42,0.16)] ring-2 ring-primary/25" : ""
        }`}
      >
        <div className="flex items-stretch gap-2 p-2 text-sm">
          <button
            type="button"
            aria-label="Drag to reorder"
            className="touch-none shrink-0 self-center rounded-lg p-1.5 text-muted-foreground hover:bg-background/60 hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          {block.kind === "stop" ? (
            <span className="relative w-20 shrink-0 self-stretch overflow-hidden rounded-xl bg-background/70">
              {find?.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={find.images[0]} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <span className="grid size-full min-h-16 place-items-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Find
                </span>
              )}
            </span>
          ) : null}
          <div className="grid min-w-0 flex-1 gap-1 py-0.5 pr-1">
            {block.kind === "note" ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Text</p>
                <p className="leading-5">{block.body}</p>
                {block.minutes ? <p className="text-muted-foreground">{block.minutes}</p> : null}
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Find</p>
                <p className="font-medium leading-5">{find?.title ?? "Find removed"}</p>
                {find ? (
                  <p className="text-muted-foreground">
                    {categoryName(find.category)}
                    {find.duration ? ` · ${find.duration}` : ""}
                    {find.cost ? ` · ${formatInr(Number(find.cost))}` : ""}
                  </p>
                ) : null}
              </>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${kindLabel}`}
            onClick={() => setConfirming(true)}
            className="shrink-0 self-start rounded-lg p-1.5 text-muted-foreground hover:bg-background/60 hover:text-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </article>
      {confirming ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
          role="presentation"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`remove-${block.id}-title`}
            className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-1">
              <h4 id={`remove-${block.id}-title`} className="font-display text-2xl">
                Remove this {kindLabel}?
              </h4>
              <p className="text-sm text-muted-foreground">
                It will leave this day’s schedule. You can add it again later if you need it.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full border border-border py-3 text-sm font-medium"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
                onClick={() => {
                  setConfirming(false);
                  onRemove();
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
