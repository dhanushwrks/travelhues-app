export type GlimpseLink = {
  kind: "story" | "itinerary" | "spot";
  storySlug: string;
  itinerarySlug?: string;
  spotId?: string;
  label: string;
};

export type GlimpseComment = {
  id: string;
  username: string;
  displayName: string;
  body: string;
  createdAt: string;
};

export type Glimpse = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  caption: string;
  videoUrl: string;
  posterUrl: string;
  country: string;
  link: GlimpseLink | null;
  likes: number;
  liked: boolean;
  comments: GlimpseComment[];
};

export function linkHref(link: GlimpseLink) {
  if (link.kind === "itinerary" && link.itinerarySlug) {
    return `/stories/${link.storySlug}/itineraries/${link.itinerarySlug}`;
  }
  return `/stories/${link.storySlug}`;
}
