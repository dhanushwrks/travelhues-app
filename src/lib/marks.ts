export type ContentMark = {
  action: "like" | "save";
  kind: "itinerary" | "spot";
  storySlug: string;
  itinerarySlug: string;
  spotId: string;
  title: string;
  storyTitle: string;
};

export type Library = {
  marks: ContentMark[];
  counts: { key: string; likes: number }[];
};

export const emptyLibrary: Library = { marks: [], counts: [] };

export function targetKey(kind: "itinerary" | "spot", storySlug: string, itinerarySlug = "", spotId = "") {
  return kind === "spot" ? `spot:${storySlug}:${spotId}` : `itinerary:${storySlug}:${itinerarySlug}`;
}

export function storyLikeCount(library: Library, slug: string) {
  let total = 0;
  for (const count of library.counts) {
    if (count.key.startsWith(`spot:${slug}:`) || count.key.startsWith(`itinerary:${slug}:`)) {
      total += count.likes;
    }
  }
  return total;
}

/** One-pass totals of spot + itinerary likes keyed by story slug. */
export function storyLikeTotals(library: Library) {
  const totals = new Map<string, number>();
  for (const count of library.counts) {
    const match = /^(?:spot|itinerary):([^:]+):/.exec(count.key);
    if (!match) continue;
    totals.set(match[1], (totals.get(match[1]) ?? 0) + count.likes);
  }
  return totals;
}

export function markState(
  library: Library,
  kind: "itinerary" | "spot",
  storySlug: string,
  itinerarySlug = "",
  spotId = "",
) {
  const key = targetKey(kind, storySlug, itinerarySlug, spotId);
  const mine = library.marks.filter(
    (mark) => targetKey(mark.kind, mark.storySlug, mark.itinerarySlug, mark.spotId) === key,
  );
  return {
    liked: mine.some((mark) => mark.action === "like"),
    saved: mine.some((mark) => mark.action === "save"),
    likes: library.counts.find((count) => count.key === key)?.likes ?? 0,
  };
}
