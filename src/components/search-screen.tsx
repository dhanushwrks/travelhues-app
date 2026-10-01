"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, X } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { Loader, PageLoader } from "@/components/loader";
import { LoginGateCard } from "@/components/login-prompt";
import { apiBase, mediaUrl } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { countryFlag } from "@/lib/countries";

type Kind = "all" | "country" | "story" | "place" | "creator" | "itinerary";
type Category = "food" | "stay" | "experiences" | "plans";
type Sort = "relevance" | "recent" | "popular";

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
  itinerarySlug: string;
  username: string;
};

type Page = {
  page: number;
  hasMore: boolean;
  total: number;
  items: Hit[];
};

const categories: { id: Category; label: string }[] = [
  { id: "food", label: "Food" },
  { id: "stay", label: "Stay" },
  { id: "experiences", label: "Experiences" },
  { id: "plans", label: "Plans" },
];

const sorts: { id: Exclude<Sort, "relevance">; label: string; hint: string }[] = [
  { id: "recent", label: "Recent", hint: "Newest first" },
  { id: "popular", label: "Popular", hint: "Most liked" },
];

export function SearchScreen({
  countries,
  initial,
  guest = false,
}: {
  countries: { code: string; name: string; flag?: string }[];
  initial: { q?: string; kind?: string; country?: string; find?: string; sort?: string };
  guest?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? "");
  const [debounced, setDebounced] = useState(initial.q ?? "");
  const [category, setCategory] = useState<Category | "">(asCategory(initial.kind, initial.find));
  const [country, setCountry] = useState((initial.country ?? "").toUpperCase());
  const [sort, setSort] = useState<Sort>(asSort(initial.sort));
  const [sortOpen, setSortOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [items, setItems] = useState<Hit[]>([]);
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
    const params = new URLSearchParams();
    const kind = categoryKind(category);
    const find = categorySpot(category);
    if (debounced) params.set("q", debounced);
    if (kind !== "all") params.set("kind", kind);
    if (country) params.set("country", country);
    if (find) params.set("find", find);
    if (sort !== "relevance") params.set("sort", sort);
    const next = params.size ? `/search?${params}` : "/search";
    router.replace(next, { scroll: false });
  }, [debounced, category, country, sort, router]);

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
  }, [debounced, category, country, sort]);

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
  }, [hasMore, loading, loadingMore, page, debounced, category, country, sort]);

  function loadPage(next: number) {
    const params = new URLSearchParams({
      q: debounced,
      kind: categoryKind(category),
      country,
      find: categorySpot(category),
      sort,
      page: String(next),
      limit: "8",
    });
    const token = readCookie("th_access");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${apiBase}/search?${params}`, {
      headers,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search is not available yet");
        return (await response.json()) as Page;
      })
      .catch((caught: unknown) => {
        if (request.current) setError(caught instanceof Error ? caught.message : "Search is not available yet");
        setLoading(false);
        setLoadingMore(false);
        return null;
      });
  }

  const categoryName = categories.find((item) => item.id === category)?.label ?? "";
  const countryName = countries.find((item) => item.code === country)?.name ?? "";
  const sortName = sorts.find((item) => item.id === sort)?.label ?? "";
  const results = items.filter((item) => item.kind !== "country");

  return (
    <div ref={scroller} className="h-full overflow-y-auto pb-8">
      <header>
        <div className="relative flex items-center justify-center px-5 pt-6">
          <BackLink href="/" label="Explore" className="absolute left-5" />
          <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-12 w-fit" />
        </div>
        <div className="grid gap-3 px-5 pt-5">
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              value={q}
              placeholder="Stories, finds, itineraries"
              className="w-full rounded-full border border-border bg-background px-4 py-3 outline-none"
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-2">
            <SelectButton
              idle="Country"
              value={countryName}
              onOpen={() => setCountryOpen(true)}
              onClear={() => setCountry("")}
            />
            <SelectButton
              idle="Category"
              value={categoryName}
              onOpen={() => setCategoryOpen(true)}
              onClear={() => setCategory("")}
            />
            <SortButton
              open={sortOpen}
              active={Boolean(sortName)}
              label={sortName ? `Sort: ${sortName}` : "Sort"}
              onOpen={setSortOpen}
            >
              {sorts.map((item) => {
                const active = sort === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-xl px-3 py-2.5 text-left ${active ? "bg-primary/10 text-primary" : ""}`}
                    onClick={() => {
                      setSort(active ? "relevance" : item.id);
                      setSortOpen(false);
                    }}
                  >
                    <span className="block text-sm">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.hint}</span>
                  </button>
                );
              })}
            </SortButton>
          </div>
        </div>
      </header>
      {countryOpen ? (
        <CountryModal
          countries={countries}
          value={country}
          onClose={() => setCountryOpen(false)}
          onPick={(code) => {
            setCountry(code);
            setCountryOpen(false);
          }}
        />
      ) : null}
      {categoryOpen ? (
        <ChoiceModal
          title="Category"
          placeholder="Search categories"
          options={categories}
          value={category}
          onClose={() => setCategoryOpen(false)}
          onPick={(id) => {
            setCategory(id as Category);
            setCategoryOpen(false);
          }}
        />
      ) : null}
      {loading && items.length === 0 ? null : (
        <p className="px-5 pt-5 text-sm text-muted-foreground">
          {total} {total === 1 ? "result" : "results"}
        </p>
      )}
      {error ? <p className="px-5 pt-2 text-sm text-primary">{error}</p> : null}
      {loading && items.length === 0 ? <PageLoader label="Searching" /> : null}
      <ul className="grid gap-3 px-5 pt-3">
        {results.map((item) => (
          <li key={hitKey(item)}>
            <Result hit={item} guest={guest} />
          </li>
        ))}
      </ul>
      {!loading && results.length === 0 && !error ? (
        <p className="px-5 pt-6 text-sm text-muted-foreground">Nothing matches that search.</p>
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

function Result({ hit, guest = false }: { hit: Hit; guest?: boolean }) {
  const body = (
    <>
      <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        {hit.kind === "country" ? (
          <span className="grid size-full place-items-center text-3xl">{countryFlag(hit.code)}</span>
        ) : hit.imageUrl ? (
          <Cover src={hit.imageUrl} />
        ) : null}
      </span>
      <span className="min-w-0 py-1 text-left">
        <span className="text-xs font-medium text-primary">{kindLabel(hit.kind)}</span>
        <span className="mt-1 block truncate font-medium">{hit.title}</span>
        <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hit.subtitle}</span>
      </span>
    </>
  );

  if (guest && hit.kind !== "country") {
    return (
      <LoginGateCard
        className="flex w-full gap-3 overflow-hidden rounded-3xl bg-card p-3 text-left ring-1 ring-border"
        label={hit.title}
        title="Sign in to open this"
        body="Sign in to open stories, creators, places, and plans."
      >
        {body}
      </LoginGateCard>
    );
  }

  return (
    <Link href={hitHref(hit)} className="flex gap-3 overflow-hidden rounded-3xl bg-card p-3 ring-1 ring-border">
      {body}
    </Link>
  );
}

function SelectButton({
  idle,
  value,
  onOpen,
  onClear,
}: {
  idle: string;
  value: string;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div className={`flex h-11 min-w-0 flex-1 items-center rounded-full border bg-background ${value ? "border-primary" : "border-border"}`}>
      <button type="button" className="min-w-0 flex-1 truncate px-4 text-left text-sm font-medium" onClick={onOpen}>
        {value || idle}
      </button>
      {value ? (
        <button
          type="button"
          aria-label={`Clear ${value}`}
          className="mr-1.5 grid size-8 shrink-0 place-items-center rounded-full"
          onClick={onClear}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function SortButton({
  open,
  active,
  label,
  onOpen,
  children,
}: {
  open: boolean;
  active: boolean;
  label: string;
  onOpen: (next: boolean) => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      const node = root.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) onOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpen]);

  return (
    <div ref={root} className={`relative shrink-0 ${open ? "z-20" : ""}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        className={`grid size-10 place-items-center rounded-full border bg-background ${active ? "border-primary text-primary" : "border-border text-foreground"}`}
        onClick={() => onOpen(!open)}
      >
        <ArrowUpDown className="size-4" />
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CountryModal({
  countries,
  value,
  onClose,
  onPick,
}: {
  countries: { code: string; name: string; flag?: string }[];
  value: string;
  onClose: () => void;
  onPick: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle ? countries.filter((item) => item.name.toLowerCase().includes(needle)) : countries;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid items-end bg-foreground/40 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Country"
        className="grid max-h-[min(32rem,85vh)] w-full grid-rows-[auto_auto_minmax(0,1fr)] gap-3 rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Country</h2>
          <button type="button" aria-label="Close" className="grid size-10 place-items-center rounded-full" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <input
          autoFocus
          value={query}
          placeholder="Search countries"
          className="rounded-full border border-border bg-background px-4 py-3 text-sm outline-none"
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="overflow-y-auto">
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">No matches</li>
          ) : (
            matches.map((item) => {
              const active = item.code === value;
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active ? "bg-primary/10 text-primary" : ""}`}
                    onClick={() => onPick(item.code)}
                  >
                    <span aria-hidden>{item.flag || countryFlag(item.code)}</span>
                    {item.name}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

function ChoiceModal({
  title,
  placeholder,
  options,
  value,
  onClose,
  onPick,
}: {
  title: string;
  placeholder: string;
  options: { id: string; label: string }[];
  value: string;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle ? options.filter((item) => item.label.toLowerCase().includes(needle)) : options;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid items-end bg-foreground/40 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="grid max-h-[min(32rem,85vh)] w-full grid-rows-[auto_auto_minmax(0,1fr)] gap-3 rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" aria-label="Close" className="grid size-10 place-items-center rounded-full" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <input
          autoFocus
          value={query}
          placeholder={placeholder}
          className="rounded-full border border-border bg-background px-4 py-3 text-sm outline-none"
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="overflow-y-auto">
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">No matches</li>
          ) : (
            matches.map((item) => {
              const active = item.id === value;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className={`flex w-full rounded-xl px-3 py-2.5 text-left text-sm ${active ? "bg-primary/10 text-primary" : ""}`}
                    onClick={() => onPick(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>,
    document.body,
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
  if (hit.kind === "itinerary") return `/stories/${hit.username}/${hit.storySlug}/itineraries/${hit.itinerarySlug}`;
  const path = `/stories/${hit.username}/${hit.storySlug}`;
  return hit.kind === "place" ? `${path}?find=${encodeURIComponent(hit.spotId)}` : path;
}

function hitKey(hit: Hit) {
  return [hit.kind, hit.code, hit.storySlug, hit.spotId, hit.itinerarySlug, hit.username, hit.title].join(":");
}

function kindLabel(kind: Hit["kind"]) {
  if (kind === "country") return "Country";
  if (kind === "story") return "Story";
  if (kind === "place") return "Find";
  if (kind === "itinerary") return "Plan";
  return "Creator";
}

function asCategory(kind: string | undefined, find: string | undefined): Category | "" {
  if (kind === "itinerary") return "plans";
  if (kind !== "place") return "";
  if (find === "food" || find === "stay") return find;
  if (find === "activity,sightseeing" || find === "experiences" || find === "experience") return "experiences";
  return "";
}

function categoryKind(category: Category | ""): Kind {
  if (category === "plans") return "itinerary";
  if (category) return "place";
  return "all";
}

function categorySpot(category: Category | ""): string {
  if (category === "food") return "food";
  if (category === "stay") return "stay";
  if (category === "experiences") return "activity,sightseeing";
  return "";
}

function asSort(value: string | undefined): Sort {
  return value === "recent" || value === "popular" ? value : "relevance";
}
