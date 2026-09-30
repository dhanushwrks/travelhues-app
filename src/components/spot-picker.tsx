"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatInr } from "@/lib/format";
import { categoryName, type StorySpot } from "@/lib/mock/studio";

const pageSize = 8;

export function SpotPicker({
  open,
  spots,
  onOpenChange,
  onAdd,
  onCreate,
}: {
  open: boolean;
  spots: StorySpot[];
  onOpenChange: (open: boolean) => void;
  onAdd: (spotId: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const [shown, setShown] = useState(pageSize);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setPicked("");
      setShown(pageSize);
    }
  }

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return spots;
    return spots.filter((spot) =>
      [spot.title, spot.placeName, spot.subcategory, categoryName(spot.category)]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, spots]);

  const visible = matches.slice(0, shown);

  function close() {
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="bottom"
        className="h-[88dvh] max-h-[88dvh] gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pr-12">
          <SheetTitle className="text-lg font-medium">Add a spot</SheetTitle>
        </div>
        <div className="grid gap-3 px-5 pt-4">
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShown(pageSize);
              }}
              placeholder="Search spots"
              aria-label="Search spots"
              className="w-full rounded-2xl border border-border bg-background py-3 pr-4 pl-10"
            />
          </label>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={onCreate} className="font-medium text-primary">
              + New spot
            </button>
            <span className="text-muted-foreground">
              {matches.length} {matches.length === 1 ? "spot" : "spots"}
            </span>
          </div>
        </div>
        <ul className="grid min-h-0 flex-1 gap-2 overflow-y-auto px-5 py-3">
          {visible.length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">
              {spots.length === 0 ? "This story has no spots yet." : "Nothing matches that search."}
            </li>
          ) : (
            visible.map((spot) => (
              <li key={spot.id}>
                <button
                  type="button"
                  aria-pressed={picked === spot.id}
                  onClick={() => setPicked(spot.id)}
                  className={`flex w-full gap-3 rounded-2xl p-2 text-left ${
                    picked === spot.id ? "bg-secondary ring-2 ring-foreground" : "bg-secondary"
                  }`}
                >
                  <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {spot.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={spot.images[0]} alt="" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 py-1">
                    <span className="block truncate font-medium">{spot.title}</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {categoryName(spot.category)}
                      {spot.duration ? ` · ${spot.duration}` : ""}
                      {spot.cost ? ` · ${formatInr(Number(spot.cost))}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
          {shown < matches.length ? (
            <li className="py-1 text-center">
              <button type="button" onClick={() => setShown((count) => count + pageSize)} className="text-sm text-primary">
                Load more
              </button>
            </li>
          ) : null}
        </ul>
        <div className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4">
          <button type="button" onClick={close} className="rounded-full border border-border py-3 text-sm font-medium">
            Cancel
          </button>
          <button
            type="button"
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              onAdd(picked);
              close();
            }}
            className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Add spot
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
