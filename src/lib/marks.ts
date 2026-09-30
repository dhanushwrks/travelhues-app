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
