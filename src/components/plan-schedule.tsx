"use client";

import {
  Bed,
  Bike,
  Bus,
  Car,
  CarTaxiFront,
  ExternalLink,
  Hotel,
  Plane,
  Ticket,
  MapPinned,
  Navigation,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Loader } from "@/components/loader";
import { estimateCommuteLeg } from "@/components/maps";
import { SpotPicker } from "@/components/spot-picker";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatCommuteDistance, formatCommuteMinutes } from "@/lib/commute";
import { formatInr } from "@/lib/format";
import {
  commuteModeLabel,
  emptyPlanReservation,
  reservationTypeLabel,
  type PlanCommute,
  type PlanReservation,
  type StorySpot,
} from "@/lib/mock/studio";
import { formatDayRange } from "@/lib/types";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30";

const commuteModes = ["cab", "public", "self_drive", "flight"] as const;
const reservationTypes = ["stay", "rental", "flight", "experience"] as const;
const rentalKinds = ["car", "bike", "scooter"] as const;

const commuteIcons = {
  cab: CarTaxiFront,
  public: Bus,
  self_drive: Car,
  flight: Plane,
} as const;

export const reservationIcons = {
  stay: Bed,
  rental: Car,
  flight: Plane,
  experience: Ticket,
} as const;

export function emptyCommute(mode: PlanCommute["mode"] = "cab"): PlanCommute {
  return { mode, notes: "", minutes: "", cost: "" };
}

export function AddItemHereMenu({
  onText,
  onSpot,
}: {
  onText: () => void;
  onSpot: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-dashed border-foreground/20 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
      >
        Add item here?
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-full left-0 z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-2xl bg-card py-1 shadow-lg ring-1 ring-border"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary"
              onClick={() => {
                setOpen(false);
                onText();
              }}
            >
              Text
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary"
              onClick={() => {
                setOpen(false);
                onSpot();
              }}
            >
              Spot
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CommuteBridge({
  commute,
  fromLabel,
  toLabel,
  fromSpot,
  toSpot,
  defaultOpen = false,
  onChange,
  onClear,
  onDismiss,
  onAddText,
  onAddSpot,
}: {
  commute?: PlanCommute;
  fromLabel: string;
  toLabel: string;
  fromSpot?: StorySpot | null;
  toSpot?: StorySpot | null;
  defaultOpen?: boolean;
  onChange: (commute: PlanCommute) => void;
  onClear: () => void;
  onDismiss?: () => void;
  onAddText?: () => void;
  onAddSpot?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function close() {
    setOpen(false);
    onDismiss?.();
  }

  const trigger = !commute ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-full border border-dashed border-foreground/20 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
    >
      How do you get there?
    </button>
  ) : (
    (() => {
      const Icon = commuteIcons[commute.mode];
      const minutes = Number(commute.minutes) || commute.mapsMinutes || 0;
      const meta = [
        formatCommuteMinutes(minutes),
        commute.cost ? formatInr(Number(commute.cost)) : "",
        commute.mapsDistanceM && commute.minutesSource !== "manual"
          ? formatCommuteDistance(commute.mapsDistanceM)
          : "",
      ]
        .filter(Boolean)
        .join(" · ");
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex max-w-full items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border/60 transition hover:ring-foreground/20"
        >
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {commuteModeLabel[commute.mode]}
            {meta ? ` · ${meta}` : ""}
          </span>
          {commute.minutesSource === "maps" || commute.minutesSource === "maps_overridden" ? (
            <span className="shrink-0 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
              Maps
            </span>
          ) : null}
        </button>
      );
    })()
  );

  return (
    <>
      <div className="relative flex gap-2 py-1 pl-1">
        <span className="ml-[18px] w-px shrink-0 self-stretch bg-border" aria-hidden />
        <div className="grid min-w-0 gap-1.5">
          {trigger}
          {onAddText && onAddSpot ? <AddItemHereMenu onText={onAddText} onSpot={onAddSpot} /> : null}
        </div>
      </div>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
          else setOpen(true);
        }}
      >
        <SheetContent
          side="bottom"
          className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
        >
          <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
            <SheetTitle className="text-lg font-medium">Getting there</SheetTitle>
            <SheetDescription className="mt-1 truncate text-sm text-muted-foreground">
              {fromLabel} → {toLabel}
            </SheetDescription>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {open ? (
              <CommuteEditor
                key={`${fromLabel}-${toLabel}-${commute?.mode ?? "new"}`}
                commute={commute ?? emptyCommute()}
                allowClear={Boolean(commute)}
                plain
                fromLabel={fromLabel}
                toLabel={toLabel}
                fromSpot={fromSpot}
                toSpot={toSpot}
                onSave={(next) => {
                  onChange(next);
                  setOpen(false);
                }}
                onCancel={close}
                onClear={() => {
                  onClear();
                  setOpen(false);
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CommuteEditor({
  commute,
  allowClear,
  plain = false,
  fromLabel,
  toLabel,
  fromSpot,
  toSpot,
  onSave,
  onCancel,
  onClear,
}: {
  commute: PlanCommute;
  allowClear: boolean;
  plain?: boolean;
  fromLabel: string;
  toLabel: string;
  fromSpot?: StorySpot | null;
  toSpot?: StorySpot | null;
  onSave: (commute: PlanCommute) => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<PlanCommute>(commute);
  const [estimating, setEstimating] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const canEstimate =
    draft.mode !== "flight" &&
    fromSpot?.lat != null &&
    fromSpot?.lng != null &&
    toSpot?.lat != null &&
    toSpot?.lng != null;

  async function fetchMaps(mode = draft.mode) {
    if (mode === "flight") return;
    if (
      fromSpot?.lat == null ||
      fromSpot?.lng == null ||
      toSpot?.lat == null ||
      toSpot?.lng == null
    ) {
      setMapsError("Both finds need a map place to estimate.");
      return;
    }
    setEstimating(true);
    setMapsError("");
    const result = await estimateCommuteLeg(
      { lat: fromSpot.lat, lng: fromSpot.lng },
      { lat: toSpot.lat, lng: toSpot.lng },
      mode,
    );
    setEstimating(false);
    if (!result) {
      setMapsError(
        mode === "public"
          ? "No public route found. Enter time yourself."
          : "Could not estimate. Enter time yourself.",
      );
      return;
    }
    setDraft((current) => ({
      ...current,
      mode,
      minutes: String(result.minutes),
      mapsMinutes: result.minutes,
      mapsDistanceM: result.distanceM,
      minutesSource: "maps",
    }));
  }

  useEffect(() => {
    if (!canEstimate || commute.minutes || commute.mapsMinutes) return;
    void fetchMaps(draft.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={
        plain ? "grid gap-3" : "rounded-2xl bg-secondary/80 p-3 ring-1 ring-border/70"
      }
    >
      {plain ? null : (
        <div className="mb-3 flex items-start gap-2">
          <Navigation className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Getting there</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {fromLabel} → {toLabel}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {commuteModes.map((mode) => {
          const Icon = commuteIcons[mode];
          const pressed = draft.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                setDraft((current) => ({ ...current, mode }));
                if (mode !== "flight" && canEstimate) void fetchMaps(mode);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-medium transition ${
                pressed
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground ring-1 ring-border"
              }`}
            >
              <Icon className="size-4" />
              {commuteModeLabel[mode]}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            Est. time (min)
            {draft.minutesSource === "maps" ? <span className="font-normal">From Maps</span> : null}
          </span>
          <input
            inputMode="numeric"
            value={draft.minutes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                minutes: event.target.value,
                minutesSource: current.mapsMinutes ? "maps_overridden" : "manual",
              }))
            }
            placeholder="25"
            className={field}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Est. cost</span>
          <input
            inputMode="numeric"
            value={draft.cost}
            onChange={(event) => setDraft((current) => ({ ...current, cost: event.target.value }))}
            placeholder="Amount"
            className={field}
          />
        </label>
      </div>

      {draft.mapsMinutes ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Google · {formatCommuteMinutes(draft.mapsMinutes)}
          {draft.mapsDistanceM ? ` · ${formatCommuteDistance(draft.mapsDistanceM)}` : ""}
          {draft.minutesSource === "maps_overridden" ? " · you edited time" : ""}
        </p>
      ) : null}

      {draft.mode !== "flight" ? (
        <button
          type="button"
          disabled={!canEstimate || estimating}
          onClick={() => void fetchMaps()}
          className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary disabled:opacity-50"
        >
          {estimating ? (
            <Loader label="Estimating" />
          ) : (
            <>
              <MapPinned className="size-3.5" />
              {canEstimate ? "Refresh from Maps" : "Needs map places on both finds"}
            </>
          )}
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          For flights, add a reservation suggestion on the itinerary instead.
        </p>
      )}

      {mapsError ? <p className="mt-2 text-xs text-primary">{mapsError}</p> : null}

      <label className="mt-3 grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <input
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Meet at Grab stand, buy BTS tickets…"
          className={field}
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onCancel} className="text-sm text-muted-foreground">
          Cancel
        </button>
        {allowClear ? (
          <button type="button" onClick={onClear} className="text-sm text-muted-foreground">
            Remove
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="ml-auto text-sm font-medium text-primary"
        >
          Save commute
        </button>
      </div>
    </div>
  );
}

export function ReservationComposer({
  initial,
  dayCount,
  spots,
  plain = false,
  onSave,
  onCancel,
  onCreateFind,
}: {
  initial?: PlanReservation;
  dayCount: number;
  spots: StorySpot[];
  plain?: boolean;
  onSave: (reservation: Omit<PlanReservation, "id">) => void;
  onCancel: () => void;
  onCreateFind: (category: "stay" | "rental") => void;
}) {
  const [draft, setDraft] = useState<Omit<PlanReservation, "id">>(
    initial
      ? {
          type: initial.type,
          title: initial.title,
          spotId: initial.spotId,
          fromDay: initial.fromDay,
          toDay: initial.toDay,
          fromPlace: initial.fromPlace,
          toPlace: initial.toPlace,
          rentalKind: initial.rentalKind,
          estCost: initial.estCost,
          link: initial.link,
          notes: initial.notes,
          airline: initial.airline,
          flightNumber: initial.flightNumber,
          timeOfDay: initial.timeOfDay,
        }
      : emptyPlanReservation({ toDay: Math.max(0, dayCount - 1) }),
  );
  const [error, setError] = useState("");
  const [findPickerOpen, setFindPickerOpen] = useState(false);
  const Icon = reservationIcons[draft.type];
  const needsFind = draft.type === "stay" || draft.type === "rental";
  const findOptions = spots.filter((spot) => {
    if (spot.archived) return false;
    if (draft.type === "stay") return spot.category === "stay";
    if (draft.type === "rental") {
      if (spot.category !== "rental") return false;
      if (!draft.rentalKind) return true;
      return spot.subcategory.toLowerCase() === draft.rentalKind;
    }
    if (draft.type === "experience") {
      return spot.category === "activity" || spot.category === "sightseeing";
    }
    return true;
  });
  const linked = spots.find((spot) => spot.id === draft.spotId);
  const dayIndexes = Array.from({ length: Math.max(dayCount, 1) }, (_, index) => index);
  const findPickerTitle =
    draft.type === "stay"
      ? "Link a stay"
      : draft.type === "rental"
        ? "Link a rental"
        : "Link a find";

  function patch(partial: Partial<Omit<PlanReservation, "id">>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function submit() {
    if (draft.type === "flight") {
      if (!draft.title.trim()) {
        setError("Add a title");
        return;
      }
    } else if (!draft.title.trim() && !linked) {
      setError("Add a title or link a find");
      return;
    }
    if (needsFind && !draft.spotId) {
      setError(draft.type === "stay" ? "Link a stay find" : "Link a rental find");
      return;
    }
    const fromDay = Math.min(Math.max(0, draft.fromDay), dayCount - 1);
    const toDay = Math.max(fromDay, Math.min(draft.toDay, dayCount - 1));
    setError("");
    onSave({
      ...draft,
      title: (draft.title.trim() || linked?.title || "Suggestion").trim(),
      fromDay,
      toDay: draft.type === "flight" || draft.type === "experience" ? fromDay : toDay,
      spotId: needsFind || draft.type === "experience" ? draft.spotId : draft.spotId,
      ...(draft.type === "flight"
        ? {
            fromPlace: "",
            toPlace: "",
            airline: "",
            flightNumber: "",
            timeOfDay: "",
            estCost: "",
            spotId: "",
            rentalKind: "" as const,
          }
        : {}),
    });
  }

  return (
    <div
      className={
        plain
          ? "grid gap-3"
          : "grid gap-3 rounded-2xl bg-secondary p-4 ring-1 ring-border/70"
      }
    >
      {plain ? null : (
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-background">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{initial ? "Edit suggestion" : "Suggest a reservation"}</p>
            <p className="text-xs text-muted-foreground">Shown to viewers on the days you pick</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pt-1 pb-1">
        {reservationTypes.map((item) => {
          const TypeIcon = reservationIcons[item];
          const pressed = draft.type === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                patch({
                  type: item,
                  spotId: "",
                  rentalKind: item === "rental" ? draft.rentalKind || "car" : "",
                  toDay: item === "flight" || item === "experience" ? draft.fromDay : draft.toDay,
                })
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
                pressed
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground ring-1 ring-border"
              }`}
            >
              <TypeIcon className="size-3.5" />
              {reservationTypeLabel[item]}
            </button>
          );
        })}
      </div>

      {draft.type === "rental" ? (
        <div className="flex gap-2">
          {rentalKinds.map((kind) => {
            const pressed = draft.rentalKind === kind;
            const KindIcon = kind === "bike" || kind === "scooter" ? Bike : Car;
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={pressed}
                onClick={() => patch({ rentalKind: kind, spotId: "" })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                  pressed
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground ring-1 ring-border"
                }`}
              >
                <KindIcon className="size-3.5" />
                {kind}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {draft.type === "flight" || draft.type === "experience" ? "Day" : "From day"}
          </span>
          <select
            value={draft.fromDay}
            onChange={(event) => {
              const fromDay = Number(event.target.value);
              patch({
                fromDay,
                toDay:
                  draft.type === "flight" || draft.type === "experience"
                    ? fromDay
                    : Math.max(fromDay, draft.toDay),
              });
            }}
            className={field}
          >
            {dayIndexes.map((index) => (
              <option key={index} value={index}>
                Day {index + 1}
              </option>
            ))}
          </select>
        </label>
        {draft.type === "stay" || draft.type === "rental" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">To day</span>
            <select
              value={draft.toDay}
              onChange={(event) => patch({ toDay: Number(event.target.value) })}
              className={field}
            >
              {dayIndexes
                .filter((index) => index >= draft.fromDay)
                .map((index) => (
                  <option key={index} value={index}>
                    Day {index + 1}
                  </option>
                ))}
            </select>
          </label>
        ) : draft.type === "experience" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Time of day</span>
            <select
              value={draft.timeOfDay}
              onChange={(event) => patch({ timeOfDay: event.target.value })}
              className={field}
            >
              <option value="">Any time</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </label>
        ) : null}
      </div>

      {needsFind || draft.type === "experience" ? (
        <div className="grid gap-2 rounded-2xl bg-background/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {draft.type === "stay"
              ? "Link a stay find"
              : draft.type === "rental"
                ? "Link a rental find"
                : "Link a find (optional)"}
          </p>
          {linked ? (
            <div className="flex items-center gap-3 rounded-2xl bg-background p-2">
              <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {linked.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={linked.images[0]} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <Hotel className="size-4" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{linked.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {linked.subcategory || linked.category}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setFindPickerOpen(true)}
                  className="text-xs font-medium text-primary"
                >
                  Change
                </button>
                {!needsFind ? (
                  <button
                    type="button"
                    onClick={() => patch({ spotId: "" })}
                    className="text-xs text-muted-foreground"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFindPickerOpen(true)}
              className="rounded-full border border-dashed border-foreground/25 py-3 text-sm font-medium"
            >
              {findOptions.length === 0 ? "Search or create a find" : "Search finds"}
            </button>
          )}
          <SpotPicker
            open={findPickerOpen}
            spots={findOptions}
            onOpenChange={setFindPickerOpen}
            title={findPickerTitle}
            confirmLabel="Link find"
            searchPlaceholder={
              draft.type === "stay"
                ? "Search stays"
                : draft.type === "rental"
                  ? "Search rentals"
                  : "Search finds"
            }
            onAdd={(spotId) => {
              const spot = spots.find((item) => item.id === spotId);
              patch({
                spotId,
                title: draft.title.trim() || spot?.title || "",
              });
            }}
            onCreate={
              needsFind
                ? () => onCreateFind(draft.type === "rental" ? "rental" : "stay")
                : undefined
            }
          />
        </div>
      ) : null}

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Title</span>
        <input
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder={
            draft.type === "flight"
              ? "Bangkok → Chiang Mai"
              : draft.type === "stay"
                ? "Old town stay"
                : draft.type === "rental"
                  ? "Car for the hills"
                  : "Suggestion title"
          }
          className={field}
        />
      </label>

      {draft.type === "flight" ? (
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Where to book</span>
          <input
            value={draft.link}
            onChange={(event) => patch({ link: event.target.value })}
            placeholder="https://"
            className={field}
          />
        </label>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Est. cost (optional)</span>
            <input
              inputMode="numeric"
              value={draft.estCost}
              onChange={(event) => patch({ estCost: event.target.value })}
              placeholder="About per night / day"
              className={field}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Where to book (optional)</span>
            <input
              value={draft.link}
              onChange={(event) => patch({ link: event.target.value })}
              placeholder="https://"
              className={field}
            />
          </label>
        </div>
      )}

      <label className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {draft.type === "flight" ? "Why" : "Why recommend this"}
        </span>
        <textarea
          value={draft.notes}
          onChange={(event) => patch({ notes: event.target.value })}
          rows={2}
          placeholder={
            draft.type === "flight"
              ? "Morning arrival leaves the day open…"
              : "Book early in peak season, walkable to the night market…"
          }
          className={field}
        />
      </label>

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border py-3 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
        >
          {initial ? "Save suggestion" : "Add suggestion"}
        </button>
      </div>
    </div>
  );
}

export function reservationSummary(item: PlanReservation, spotTitle?: string) {
  const parts = [
    reservationTypeLabel[item.type],
    formatDayRange(item.fromDay, item.toDay),
    item.rentalKind ? item.rentalKind : "",
    spotTitle || "",
    item.estCost ? formatInr(Number(item.estCost)) : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export function ReservationListCard({
  item,
  spotTitle,
  onEdit,
  onRemove,
}: {
  item: PlanReservation;
  spotTitle?: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const Icon = reservationIcons[item.type];
  return (
    <article className="rounded-2xl bg-secondary p-3">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggested {reservationTypeLabel[item.type].toLowerCase()}
          </p>
          <p className="font-medium">{item.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{reservationSummary(item, spotTitle)}</p>
          {item.notes ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.notes}</p> : null}
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              Where to book
              <ExternalLink className="size-3" />
            </a>
          ) : null}
          <div className="mt-2 flex gap-4">
            <button type="button" onClick={onEdit} className="text-sm text-muted-foreground">
              Edit
            </button>
            <button type="button" onClick={onRemove} className="text-sm text-muted-foreground">
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
