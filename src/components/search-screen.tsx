"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { spotTypeMeta } from "@/components/spot-type";
import { apiBase, mediaUrl } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { countryFlag } from "@/lib/countries";
import { spotTypes } from "@/lib/types";

type Kind = "all" | "country" | "story" | "place" | "creator";
type Sort = "relevance" | "name" | "popular";

type Hit = {
  kind: Exclude<Kind, "all">;
  title: string;
  subtitle: string;
  imageUrl: string;
  country: string;
  spotType: string;
  code: string;
  storySlug: string;
  spotId: string;
  username: string;
};

type Page = {
  page: number;
  hasMore: boolean;
  total: number;
  items: Hit[];
};

const kinds: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "country", label: "Countries" },
  { id: "story", label: "Stories" },
  { id: "place", label: "Places" },
  { id: "creator", label: "Creators" },
];

const sorts: { id: Sort; label: string }[] = [
  { id: "relevance", label: "Best match" },
  { id: "name", label: "Name" },
  { id: "popular", label: "Popular" },
];

export function SearchScreen({
  countries,
  initial,
}: {
  countries: { code: string; name: string; flag?: string }[];
  initial: { q?: string; kind?: string; country?: string; spot?: string; sort?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? "");
  const [debounced, setDebounced] = useState(initial.q ?? "");
  const [kind, setKind] = useState<Kind>(asKind(initial.kind));
  const [country, setCountry] = useState((initial.country ?? "").toUpperCase());
  const [spot, setSpot] = useState(initial.spot ?? "");
  const [sort, setSort] = useState<Sort>(asSort(initial.sort));
  const [items, setItems] = useState<Hit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    if (kind !== "all") params.set("kind", kind);
    if (country) params.set("country", country);
    if (spot && (kind === "all" || kind === "place")) params.set("spot", spot);
    if (sort !== "relevance") params.set("sort", sort);
    const next = params.size ? `/search?${params}` : "/search";
    router.replace(next, { scroll: false });
  }, [debounced, kind, country, spot, sort, router]);

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
  }, [debounced, kind, country, spot, sort]);

  useEffect(() => {
    const node = sentinel.current;
    const root = scroller.current;
    if (!node || !root || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        const id = ++request.current;
        const next = page + 1;
        setLoading(true);
        void loadPage(next).then((result) => {
          if (id !== request.current || !result) return;
          setItems((current) => [...current, ...result.items]);
          setPage(next);
          setHasMore(result.hasMore);
          setTotal(result.total);
          setLoading(false);
        });
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page, debounced, kind, country, spot, sort]);

  function loadPage(next: number) {
    const params = new URLSearchParams({
      q: debounced,
      kind,
      country,
      sort,
      page: String(next),
      limit: "8",
    });
    if (kind === "all" || kind === "place") params.set("spot", spot);
    return fetch(`${apiBase}/search?${params}`, {
      headers: { Authorization: `Bearer ${readCookie("th_access")}` },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search is not available yet");
        return (await response.json()) as Page;
      })
      .catch((caught: unknown) => {
        if (request.current) setError(caught instanceof Error ? caught.message : "Search is not available yet");
        setLoading(false);
        return null;
      });
  }

  return (
    <div ref={scroller} className="h-full overflow-y-auto pb-8">
      <header className="grid gap-4 px-5 pt-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium">
            Explore
          </Link>
          <h1 className="font-display text-3xl">Search</h1>
        </div>
        <label className="grid gap-2 text-sm">
          <span className="sr-only">Search</span>
          <input
            value={q}
            placeholder="Countries, stories, places, creators"
            className="rounded-full border border-border bg-background px-4 py-3 outline-none"
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <div className="flex gap-2 overflow-x-auto" aria-label="What to search">
          {kinds.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={kind === item.id}
              onClick={() => setKind(item.id)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ${
                kind === item.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2"
            >
              <option value="">Any country</option>
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(asSort(event.target.value))}
              className="rounded-2xl border border-border bg-background px-3 py-2"
            >
              {sorts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {kind === "all" || kind === "place" ? (
          <div className="flex gap-2 overflow-x-auto" aria-label="Place type">
            <FilterChip label="Any place" pressed={spot === ""} onClick={() => setSpot("")} />
            {spotTypes.map((type) => (
              <FilterChip
                key={type}
                label={spotTypeMeta[type].label}
                pressed={spot === type}
                onClick={() => setSpot(type)}
              />
            ))}
          </div>
        ) : null}
      </header>
      <p className="px-5 pt-4 text-sm text-muted-foreground">
        {loading && items.length === 0 ? "Searching" : `${total} ${total === 1 ? "result" : "results"}`}
      </p>
      {error ? <p className="px-5 pt-2 text-sm text-primary">{error}</p> : null}
      <ul className="grid gap-3 px-5 pt-3">
        {items.map((item) => (
          <li key={hitKey(item)}>
            <Result hit={item} />
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && !error ? (
        <p className="px-5 pt-6 text-sm text-muted-foreground">Nothing matches that search.</p>
      ) : null}
      <div ref={sentinel} className="h-8" />
      {loading && items.length > 0 ? <p className="px-5 pb-4 text-sm text-muted-foreground">Loading more</p> : null}
    </div>
  );
}

function Result({ hit }: { hit: Hit }) {
  return (
    <Link href={hitHref(hit)} className="flex gap-3 overflow-hidden rounded-3xl bg-card p-3 ring-1 ring-border">
      <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        {hit.kind === "country" ? (
          <span className="grid size-full place-items-center text-3xl">{countryFlag(hit.code)}</span>
        ) : hit.imageUrl ? (
          <Cover src={hit.imageUrl} />
        ) : null}
      </span>
      <span className="min-w-0 py-1">
        <span className="text-xs font-medium text-primary">{kindLabel(hit.kind)}</span>
        <span className="mt-1 block truncate font-medium">{hit.title}</span>
        <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hit.subtitle}</span>
      </span>
    </Link>
  );
}

function FilterChip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-3 text-sm ${pressed ? "bg-foreground text-background" : "bg-card ring-1 ring-border"}`}
    >
      {label}
    </button>
  );
}

function Cover({ src }: { src: string }) {
  const url = mediaUrl(src);
  if (url.includes("images.unsplash.com")) {
    return <Image src={url} alt="" fill className="object-cover" sizes="80px" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-full object-cover" />
  );
}

function hitHref(hit: Hit) {
  if (hit.kind === "country") return `/?country=${hit.code}`;
  if (hit.kind === "creator") return `/u/${hit.username}`;
  const path = `/stories/${hit.username}/${hit.storySlug}`;
  return hit.kind === "place" ? `${path}?spot=${encodeURIComponent(hit.spotId)}` : path;
}

function hitKey(hit: Hit) {
  return [hit.kind, hit.code, hit.storySlug, hit.spotId, hit.username, hit.title].join(":");
}

function kindLabel(kind: Hit["kind"]) {
  if (kind === "country") return "Country";
  if (kind === "story") return "Story";
  if (kind === "place") return "Place";
  return "Creator";
}

function asKind(value: string | undefined): Kind {
  return kinds.some((item) => item.id === value) ? (value as Kind) : "all";
}

function asSort(value: string | undefined): Sort {
  return sorts.some((item) => item.id === value) ? (value as Sort) : "relevance";
}
