import { redirect } from "next/navigation";

import type { Glimpse } from "@/lib/glimpse";
import type { Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";
import { apiBase } from "@/lib/api";
import type { Itinerary, Story } from "@/lib/types";

const base = apiBase;

async function load<T>(path: string, token: string): Promise<T | null> {
  const response = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load Travelhues");
  return (await response.json()) as T;
}

export function loadGlimpses(token: string, country?: string) {
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
  const countries = (await countriesResponse.json()) as { code: string; name: string }[];
  const enabled = new Set(settings.app?.enabledCountries ?? []);
  return countries.filter((country) => enabled.has(country.code));
}

export function loadStories(token: string) {
  return load<Story[]>("/stories", token);
}

export function loadStory(token: string, slug: string) {
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

export function loadProfile(token: string, username: string) {
  return load<Person>(`/profiles/${username}`, token);
}

export function loadLibrary(token: string) {
  return load<Library>("/marks", token);
}

export function loadCreator(token: string, username: string) {
  return load<{ creator: Story["creator"]; stories: Story[] }>(
    `/creators/${username}`,
    token,
  );
}
