import { redirect } from "next/navigation";

import type { Glimpse } from "@/lib/glimpse";
import type { Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";
import { apiBase } from "@/lib/api";
import type { Itinerary, Story } from "@/lib/types";

const base = apiBase;

async function load<T>(path: string, token?: string): Promise<T | null> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    headers,
    cache: "no-store",
  });
  if (response.status === 401) {
    if (token) redirect("/login");
    return null;
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load Travelhues");
  return (await response.json()) as T;
}

export function loadGlimpses(token?: string, country?: string) {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  return load<Glimpse[]>(`/glimpses${query}`, token);
}

export async function loadEnabledCountries() {
  const [settingsResponse, countriesResponse] = await Promise.all([
    fetch(`${base}/settings`, { cache: "no-store" }),
    fetch(`${base}/countries`, { cache: "no-store" }),
  ]);
  if (!settingsResponse.ok || !countriesResponse.ok) return [];
  const settings = (await settingsResponse.json()) as {
    app?: { enabledCountries?: string[] };
  };
  const countries = (await countriesResponse.json()) as {
    code: string;
    name: string;
    flag?: string;
  }[];
  const enabled = new Set(settings.app?.enabledCountries ?? []);
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
    const response = await fetch(`${base}/settings`, { cache: "no-store" });
    if (!response.ok) return brandLinkDefaults;
    const settings = (await response.json()) as { app?: Partial<BrandLinks> };
    const app = settings.app ?? {};
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

export function loadStory(token: string | undefined, slug: string) {
  return load<Story>(`/stories/${slug}`, token);
}

export function loadItinerary(token: string, slug: string, itinerarySlug: string) {
  return load<{ story: Story; itinerary: Itinerary }>(
    `/stories/${slug}/itineraries/${itinerarySlug}`,
    token,
  );
}

export function loadMe(token: string) {
  return load<Person>("/me", token);
}

export function loadProfile(token: string | undefined, username: string) {
  return load<Person>(`/profiles/${username}`, token);
}

export function loadLibrary(token?: string) {
  if (!token) return Promise.resolve(null);
  return load<Library>("/marks", token);
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
