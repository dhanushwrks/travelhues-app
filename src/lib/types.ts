export const spotTypes = [
  "stay",
  "food",
  "activity",
  "sightseeing",
  "shop",
] as const;

export type SpotType = (typeof spotTypes)[number];

export type Spot = {
  id: string;
  type: SpotType;
  title: string;
  description: string;
  images: string[];
  lat: number;
  lng: number;
  address: string;
  avgMinutes: number;
  avgCostThb: number;
  tags: string[];
  archived?: boolean;
};

export type NoteBlock = {
  kind: "note";
  body: string;
};

export type SpotBlock = {
  kind: "spot";
  spotId: string;
  body: string;
};

export type Block = NoteBlock | SpotBlock;

export type Day = {
  title: string;
  blocks: Block[];
};

export type Itinerary = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  days: Day[];
  archived?: boolean;
};

export type Creator = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
};

export type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

export type StoryBlog = {
  slug: string;
  title: string;
  body: string;
  coverUrl?: string;
  archived?: boolean;
};

export type Story = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  images?: string[];
  ownerId?: string;
  destination: Destination;
  creator: Creator;
  spots: Spot[];
  itineraries: Itinerary[];
  blogs?: StoryBlog[];
};

export function storyImages(story: Pick<Story, "coverUrl" | "images">) {
  const urls = [story.coverUrl, ...(story.images ?? [])].filter((url) => url.trim());
  return [...new Set(urls)];
}

export function storyHref(story: Pick<Story, "slug" | "creator">, spotId = "") {
  const path = `/stories/${story.creator.username}/${story.slug}`;
  return spotId ? `${path}?spot=${encodeURIComponent(spotId)}` : path;
}

export function itineraryHref(story: Pick<Story, "slug" | "creator">, itinerarySlug: string) {
  return `/stories/${story.creator.username}/${story.slug}/itineraries/${itinerarySlug}`;
}
