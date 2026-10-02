import { unstable_cache } from "next/cache";

import { apiBase } from "@/lib/api";
import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from "@/lib/server-cache";

export type SpotCatalogItem = {
  slug: string;
  label: string;
  kinds: string[];
};

export const seedSpotCatalog: SpotCatalogItem[] = [
  { slug: "stay", label: "Stay", kinds: ["Hotel", "Guesthouse", "Homestay"] },
  { slug: "food", label: "Food", kinds: ["Restaurant", "Cafe", "Street food"] },
  { slug: "activity", label: "Activity", kinds: ["Trek", "Class", "Boat", "Walk"] },
  { slug: "sightseeing", label: "Sightseeing", kinds: ["Temple", "Viewpoint", "Neighborhood"] },
  { slug: "shop", label: "Shop", kinds: ["Market", "Boutique"] },
  { slug: "rental", label: "Rental", kinds: ["Car", "Bike", "Scooter"] },
];

function normalizeCatalog(body: SpotCatalogItem[] | null): SpotCatalogItem[] {
  if (!body || !Array.isArray(body) || body.length === 0) return seedSpotCatalog;
  const catalog = body.filter(
    (item) =>
      item &&
      typeof item.slug === "string" &&
      typeof item.label === "string" &&
      Array.isArray(item.kinds),
  );
  return catalog.length > 0 ? catalog : seedSpotCatalog;
}

async function fetchSpotCatalogRemote(): Promise<SpotCatalogItem[]> {
  try {
    const response = await fetch(`${apiBase}/spot-catalog`, {
      next: { revalidate: PUBLIC_CACHE_SECONDS },
    });
    if (!response.ok) return seedSpotCatalog;
    const body = (await response.json()) as SpotCatalogItem[];
    return normalizeCatalog(body);
  } catch {
    return seedSpotCatalog;
  }
}

const cachedSpotCatalog = unstable_cache(
  fetchSpotCatalogRemote,
  ["travelhues-spot-catalog"],
  { revalidate: PUBLIC_CACHE_SECONDS, tags: [CACHE_TAGS.spotCatalog] },
);

let clientCatalogCache: { at: number; value: SpotCatalogItem[] } | null = null;
const CLIENT_CATALOG_TTL_MS = 15 * 60 * 1000;

export async function fetchSpotCatalog(): Promise<SpotCatalogItem[]> {
  if (typeof window !== "undefined") {
    if (clientCatalogCache && Date.now() - clientCatalogCache.at < CLIENT_CATALOG_TTL_MS) {
      return clientCatalogCache.value;
    }
    try {
      const response = await fetch(`${apiBase}/spot-catalog`, { cache: "no-store" });
      if (!response.ok) return seedSpotCatalog;
      const body = (await response.json()) as SpotCatalogItem[];
      const catalog = normalizeCatalog(body);
      clientCatalogCache = { at: Date.now(), value: catalog };
      return catalog;
    } catch {
      return seedSpotCatalog;
    }
  }
  return cachedSpotCatalog();
}
