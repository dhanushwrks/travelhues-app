import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Glimpse } from "@/lib/glimpse";
import { defaultShortAds, normalizeShortAds, type ShortAd } from "@/lib/short-ad";
import type { Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";
import { apiBase } from "@/lib/api";
import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from "@/lib/server-cache";
import type { Itinerary, PublicFlightDeal, Story } from "@/lib/types";

const base = apiBase;
const fetchLog = process.env.TH_FETCH_LOG === "1";

async function load<T>(path: string, token?: string): Promise<T | null> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const started = fetchLog ? performance.now() : 0;
  const response = await fetch(`${base}${path}`, {
    headers,
    cache: "no-store",
  });
  if (fetchLog) {
    const length = response.headers.get("content-length") ?? "?";
    console.info(
      `[travelhues] ${path} ${Math.round(performance.now() - started)}ms status=${response.status} bytes=${length}`,
    );
  }
  if (response.status === 401) {
    if (token) redirect("/login");
    return null;
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load Travelhues");
  return (await response.json()) as T;
}

async function fetchPublicJson<T>(path: string): Promise<T | null> {
  const response = await fetch(`${base}${path}`, {
    next: { revalidate: PUBLIC_CACHE_SECONDS },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

const cachedSettings = unstable_cache(
  () => fetchPublicJson<{ app?: Record<string, unknown> }>("/settings"),
  ["travelhues-public-settings"],
  { revalidate: PUBLIC_CACHE_SECONDS, tags: [CACHE_TAGS.settings] },
);

const cachedCountries = unstable_cache(
  () =>
    fetchPublicJson<{ code: string; name: string; flag?: string }[]>("/countries"),
  ["travelhues-public-countries"],
  { revalidate: PUBLIC_CACHE_SECONDS, tags: [CACHE_TAGS.countries] },
);

const cachedShortAds = unstable_cache(
  () => fetchPublicJson<ShortAd[]>("/ads/hues"),
  ["travelhues-public-short-ads"],
  { revalidate: PUBLIC_CACHE_SECONDS, tags: [CACHE_TAGS.shortAds] },
);

export function loadGlimpses(token?: string, country?: string, storySlug?: string) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (storySlug) params.set("storySlug", storySlug);
  const query = params.size ? `?${params}` : "";
  return load<Glimpse[]>(`/glimpses${query}`, token);
}

export type StoryHighlightMedia = {
  videoUrl: string;
  streamUrl: string;
};

export async function loadStoryHighlightMedia(
  token: string | undefined,
  storySlug: string,
  countryCode?: string,
): Promise<StoryHighlightMedia> {
  const glimpses = await loadGlimpses(token, countryCode, storySlug);
  const match = (glimpses ?? []).find(
    (item) => item.link?.storySlug === storySlug && (item.streamUrl || item.videoUrl),
  );
  return {
    videoUrl: match?.videoUrl ?? "",
    streamUrl: match?.streamUrl ?? "",
  };
}

export async function loadStoryHighlightVideo(
  token: string | undefined,
  storySlug: string,
  countryCode?: string,
): Promise<string> {
  const media = await loadStoryHighlightMedia(token, storySlug, countryCode);
  return media.streamUrl || media.videoUrl;
}

export function loadShortAds() {
  return cachedShortAds();
}

export async function loadShortAdsForFeed(): Promise<ShortAd[]> {
  const remote = await loadShortAds();
  const parsed = normalizeShortAds(remote);
  return parsed.length > 0 ? parsed : defaultShortAds;
}

export async function loadEnabledCountries() {
  const [settings, countries] = await Promise.all([cachedSettings(), cachedCountries()]);
  if (!settings || !countries) return [];
  const enabled = new Set(
    (settings.app?.enabledCountries as string[] | undefined) ?? [],
  );
  return countries.filter((country) => enabled.has(country.code));
}

export type BrandLinks = {
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  termsUrl: string;
  policiesUrl: string;
};

export const brandLinkDefaults: BrandLinks = {
  instagramUrl: "https://www.instagram.com/travelhues",
  linkedinUrl: "https://www.linkedin.com/company/travelhues",
  youtubeUrl: "https://www.youtube.com/@travelhues",
  termsUrl: "https://travelhues.com/terms",
  policiesUrl: "https://travelhues.com/policies",
};

export async function loadBrandLinks(): Promise<BrandLinks> {
  try {
    const settings = await cachedSettings();
    if (!settings) return brandLinkDefaults;
    const app = (settings.app ?? {}) as Partial<BrandLinks>;
    return {
      instagramUrl: app.instagramUrl ?? brandLinkDefaults.instagramUrl,
      linkedinUrl: app.linkedinUrl ?? brandLinkDefaults.linkedinUrl,
      youtubeUrl: app.youtubeUrl ?? brandLinkDefaults.youtubeUrl,
      termsUrl: app.termsUrl ?? brandLinkDefaults.termsUrl,
      policiesUrl: app.policiesUrl ?? brandLinkDefaults.policiesUrl,
    };
  } catch {
    return brandLinkDefaults;
  }
}

export function loadStories(token?: string) {
  return load<Story[]>("/stories", token);
}

export function loadDestinations(
  token: string | undefined,
  query: { country?: string; limit?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.country) params.set("country", query.country);
  params.set("limit", String(query.limit ?? 10));
  return load<Story[]>(`/destinations?${params}`, token);
}

const loadStoryCached = cache((token: string | undefined, slug: string) =>
  load<Story>(`/stories/${slug}`, token),
);

export function loadStory(token: string | undefined, slug: string) {
  return loadStoryCached(token, slug);
}

const loadItineraryCached = cache((token: string, slug: string, itinerarySlug: string) =>
  load<{ story: Story; itinerary: Itinerary }>(
    `/stories/${slug}/itineraries/${itinerarySlug}`,
    token,
  ),
);

export function loadItinerary(token: string, slug: string, itinerarySlug: string) {
  return loadItineraryCached(token, slug, itinerarySlug);
}

export function loadMe(token: string) {
  return load<Person>("/me", token);
}

const loadProfileCached = cache((token: string | undefined, username: string) =>
  load<Person>(`/profiles/${username}`, token),
);

export function loadProfile(token: string | undefined, username: string) {
  return loadProfileCached(token, username);
}

export function loadLibrary(token?: string) {
  if (!token) return Promise.resolve(null);
  return load<Library>("/marks", token);
}

export type PurchaseKind = "spot" | "itinerary" | "blog";

export async function purchaseContent(
  token: string,
  input: { storySlug: string; kind: PurchaseKind; itemId: string; sourceDealId?: string },
) {
  const response = await fetch(`${base}/purchases`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Could not complete purchase");
  }
  return response.json() as Promise<{ ok: boolean; alreadyOwned?: boolean }>;
}

const loadFlightDealsCached = cache((origin: string, limit: number) => {
  const params = new URLSearchParams();
  if (origin) params.set("origin", origin);
  params.set("limit", String(limit));
  return load<PublicFlightDeal[]>(`/flight-deals?${params}`);
});

export function loadFlightDeals(origin?: string, limit = 20) {
  return loadFlightDealsCached(origin?.toUpperCase() ?? "", limit);
}

export function loadFlightDeal(id: string) {
  return load<PublicFlightDeal>(`/flight-deals/${id}`);
}

export async function trackFlightDealEvent(
  dealId: string,
  type: string,
  token?: string,
  metadata?: Record<string, unknown>,
) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  await fetch(`${base}/flight-deals/${dealId}/events`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type, metadata }),
  }).catch(() => undefined);
}

export function loadCreator(token: string | undefined, username: string) {
  return load<{ creator: Story["creator"]; stories: Story[] }>(
    `/creators/${username}`,
    token,
  );
}

export type CreatorListItem = {
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  blurb: string;
  introVideoUrl: string;
  stories: number;
  countries: number;
  spots: number;
  itineraries: number;
  blogs: number;
};

export type CreatorsPage = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  items: CreatorListItem[];
};

export function loadCreators(
  token: string | undefined,
  query: { q?: string; country?: string; page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.country) params.set("country", query.country);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const suffix = params.size ? `?${params}` : "";
  return load<CreatorsPage>(`/creators${suffix}`, token);
}
