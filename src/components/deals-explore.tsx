"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Loader2, MapPin, SlidersHorizontal } from "lucide-react";

import { FlightDealCard } from "@/components/flight-deal-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchFlightDealsPage } from "@/lib/remote";
import { flightDealOrigins, type FlightDealSort, type PublicFlightDeal } from "@/lib/types";

const PAGE_SIZE = 5;

const sortOptions: { id: FlightDealSort; label: string; hint: string }[] = [
  { id: "featured", label: "Featured", hint: "Best match for you" },
  { id: "latest", label: "Latest", hint: "Recently updated" },
  { id: "offer", label: "Offer %", hint: "Biggest discount first" },
];

export function DealsExplore({
  initialOrigin,
  initialItems,
  initialHasMore,
}: {
  initialOrigin: string;
  initialItems: PublicFlightDeal[];
  initialHasMore: boolean;
}) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [originDraft, setOriginDraft] = useState(initialOrigin);
  const [sort, setSort] = useState<FlightDealSort>("featured");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const originLabel = origin ? origin : "All origins";

  const reload = useCallback(async (nextOrigin: string, nextSort: FlightDealSort) => {
    setLoading(true);
    try {
      const page = await fetchFlightDealsPage({
        origin: nextOrigin || undefined,
        limit: PAGE_SIZE,
        offset: 0,
        sort: nextSort,
      });
      setItems(page.items);
      setHasMore(page.hasMore);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const page = await fetchFlightDealsPage({
        origin: origin || undefined,
        limit: PAGE_SIZE,
        offset: items.length,
        sort,
      });
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } finally {
      setLoading(false);
    }
  }, [hasMore, items.length, loading, origin, sort]);

  const skipInitialReload = useRef(true);
  useEffect(() => {
    if (skipInitialReload.current) {
      skipInitialReload.current = false;
      return;
    }
    void reload(origin, sort);
  }, [origin, sort, reload]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const filteredOrigins = useMemo(() => {
    const query = originDraft.trim().toUpperCase();
    return flightDealOrigins.filter((code) => !query || code.includes(query));
  }, [originDraft]);

  return (
    <>
      <div className="mt-5 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-2 rounded-full"
          onClick={() => {
            setOriginDraft(origin);
            setFilterOpen(true);
          }}
        >
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{originLabel}</span>
          <SlidersHorizontal className="ml-auto size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-full"
          aria-label="Sort deals"
          onClick={() => setSortOpen(true)}
        >
          <ArrowDownUp className="size-4" />
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading deals…
        </p>
      ) : null}

      <ul className="mt-5 grid gap-2.5">
        {items.map((deal) => (
          <li key={deal.id}>
            <FlightDealCard deal={deal} />
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No active deals for this filter. Try another origin or clear the filter.
        </p>
      ) : null}

      <div ref={sentinelRef} className="h-8" aria-hidden />
      {loading && items.length > 0 ? (
        <p className="pb-6 text-center text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline size-3 animate-spin" aria-hidden />
          Loading more…
        </p>
      ) : null}

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden />
              Origin airport
            </SheetTitle>
          </SheetHeader>
          <input
            type="search"
            value={originDraft}
            onChange={(event) => setOriginDraft(event.target.value.toUpperCase())}
            placeholder="Search IATA code (e.g. BOM)"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            maxLength={3}
            autoCapitalize="characters"
          />
          <ul className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-border">
            <li>
              <button
                type="button"
                className="flex w-full px-4 py-3 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setOrigin("");
                  setFilterOpen(false);
                }}
              >
                All origins
              </button>
            </li>
            {filteredOrigins.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className="flex w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted"
                  onClick={() => {
                    setOrigin(code);
                    setFilterOpen(false);
                  }}
                >
                  {code}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ArrowDownUp className="size-4" aria-hidden />
              Sort by
            </SheetTitle>
          </SheetHeader>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {sortOptions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-4 py-3 text-left hover:bg-muted"
                  onClick={() => {
                    setSort(option.id);
                    setSortOpen(false);
                  }}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
