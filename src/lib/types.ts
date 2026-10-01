export const spotTypes = [
  "stay",
  "food",
  "activity",
  "sightseeing",
  "shop",
  "rental",
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

export const commuteModes = ["walk", "cycle", "cab", "public", "self_drive", "flight"] as const;
export type CommuteMode = (typeof commuteModes)[number];

export type CommuteLeg = {
  mode: CommuteMode;
  notes?: string;
  minutes?: number;
  costThb?: number;
  mapsMinutes?: number;
  mapsDistanceM?: number;
  minutesSource?: "manual" | "maps" | "maps_overridden";
};

export const reservationTypes = ["stay", "rental", "flight", "experience"] as const;
export type ReservationType = (typeof reservationTypes)[number];

export type Reservation = {
  id: string;
  type: ReservationType;
  title: string;
  spotId?: string;
  fromDay: number;
  toDay: number;
  fromPlace?: string;
  toPlace?: string;
  rentalKind?: "car" | "bike" | "scooter";
  estCostThb?: number;
  link?: string;
  notes?: string;
  airline?: string;
  flightNumber?: string;
  timeOfDay?: string;
};

export type NoteBlock = {
  kind: "note";
  body: string;
};

export type SpotBlock = {
  kind: "spot";
  spotId: string;
  body: string;
  commute?: CommuteLeg;
};

export type Block = NoteBlock | SpotBlock;

export type Day = {
  title: string;
  brief?: string;
  blocks: Block[];
};

export type Itinerary = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  days: Day[];
  reservations?: Reservation[];
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
  archived?: boolean;
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

export function blogHref(story: Pick<Story, "slug" | "creator">, blogSlug: string) {
  return `/stories/${story.creator.username}/${story.slug}/blogs/${blogSlug}`;
}

export function reservationsForDay(reservations: Reservation[] | undefined, dayIndex: number) {
  return (reservations ?? []).filter(
    (item) => dayIndex >= item.fromDay && dayIndex <= item.toDay,
  );
}

export function formatDayRange(fromDay: number, toDay: number) {
  if (fromDay === toDay) return `Day ${fromDay + 1}`;
  return `Day ${fromDay + 1}–${toDay + 1}`;
}
