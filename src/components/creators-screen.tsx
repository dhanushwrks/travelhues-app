"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { CreatorCard, type CreatorCardData } from "@/components/creator-card";
import { Loader, PageLoader } from "@/components/loader";
import { apiBase } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { cachedClientGet } from "@/lib/client-fetch-cache";

type Page = {
  page: number;
  hasMore: boolean;
  total: number;
  items: CreatorCardData[];
};

export function CreatorsScreen() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<CreatorCardData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const id = ++request.current;
    setLoading(true);
    setError("");
    setItems([]);
    setHasMore(false);
    void loadPage(1).then((result) => {
      if (id !== request.current || !result) return;
      setItems(result.items);
      setPage(1);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setLoading(false);
    });
  }, [debounced]);

  useEffect(() => {
    const node = sentinel.current;
    const root = scroller.current;
    if (!node || !root || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        const id = ++request.current;
        const next = page + 1;
        setLoadingMore(true);
        void loadPage(next).then((result) => {
          if (id !== request.current || !result) return;
          setItems((current) => [...current, ...result.items]);
          setPage(next);
          setHasMore(result.hasMore);
          setTotal(result.total);
          setLoadingMore(false);
        });
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, debounced]);

  function loadPage(next: number) {
    const params = new URLSearchParams({
      q: debounced,
      page: String(next),
      limit: "8",
    });
    const token = readCookie("th_access");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const cacheKey = `creators:${params}`;
    return cachedClientGet(cacheKey, () =>
      fetch(`${apiBase}/creators?${params}`, {
        headers,
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Creators are not available yet");
          return (await response.json()) as Page;
        })
        .catch((caught: unknown) => {
          if (request.current) {
            setError(caught instanceof Error ? caught.message : "Creators are not available yet");
          }
          setLoading(false);
          setLoadingMore(false);
          return null;
        }),
    );
  }

  return (
    <div ref={scroller} className="h-full overflow-y-auto pb-8">
      <header className="grid gap-4 px-5 pt-6">
        <div className="relative flex items-center justify-center">
          <BackLink href="/" label="Explore" className="absolute left-0" />
          <h1 className="font-display text-3xl">Creators</h1>
        </div>
        <label className="relative block text-sm">
          <span className="sr-only">Search creators</span>
          <input
            value={q}
            placeholder="Search by name"
            className="w-full rounded-full border border-border bg-background py-3 pr-12 pl-4 outline-none"
            onChange={(event) => setQ(event.target.value)}
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full"
              onClick={() => setQ("")}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </label>
      </header>

      {loading && items.length === 0 ? null : (
        <p className="px-5 pt-5 text-sm text-muted-foreground">
          {total} {total === 1 ? "creator" : "creators"}
        </p>
      )}
      {error ? <p className="px-5 pt-2 text-sm text-primary">{error}</p> : null}
      {loading && items.length === 0 ? <PageLoader label="Loading creators" /> : null}
      <ul className="mt-3 grid gap-4 px-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((creator) => (
          <li key={creator.username}>
            <CreatorCard creator={creator} detailed />
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && !error ? (
        <p className="px-5 pt-6 text-sm text-muted-foreground">No creators match that search.</p>
      ) : null}
      {loadingMore ? (
        <div className="grid place-items-center px-5 py-8 text-sm text-muted-foreground">
          <Loader label="Loading more" className="size-5 text-primary" />
        </div>
      ) : (
        <div ref={sentinel} className="h-8" />
      )}
    </div>
  );
}
