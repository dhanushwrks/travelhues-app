import { apiBase } from "@/lib/api";

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
];

export async function fetchSpotCatalog(): Promise<SpotCatalogItem[]> {
  try {
    const response = await fetch(`${apiBase}/spot-catalog`, { cache: "no-store" });
    if (!response.ok) return seedSpotCatalog;
    const body = (await response.json()) as SpotCatalogItem[];
    if (!Array.isArray(body) || body.length === 0) return seedSpotCatalog;
    const catalog = body.filter(
      (item) =>
        item &&
        typeof item.slug === "string" &&
        typeof item.label === "string" &&
        Array.isArray(item.kinds),
    );
    return catalog.length > 0 ? catalog : seedSpotCatalog;
  } catch {
    return seedSpotCatalog;
  }
}
