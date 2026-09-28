const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export type MediaKind = "photo" | "video" | "glimpse";

export type MediaPost = {
  id: string;
  kind: MediaKind;
  caption: string;
  imageUrl: string;
  videoUrl: string;
};

export type StudioKind = "story" | "spot" | "itinerary" | "blog";

export type StudioPiece = {
  id: string;
  kind: StudioKind;
  title: string;
  summary: string;
  status: "draft" | "published";
};

export const studioKinds: StudioKind[] = ["story", "spot", "itinerary", "blog"];

export const kindLabel: Record<StudioKind, string> = {
  story: "Stories",
  spot: "Spots",
  itinerary: "Itineraries",
  blog: "Blogs",
};

export const kindSingular: Record<StudioKind, string> = {
  story: "story",
  spot: "spot",
  itinerary: "itinerary",
  blog: "blog",
};

export const storefrontBio =
  "I film the road as it happens, from night markets to slow trains, and leave the route so someone else can walk it.";

export const seedPosts: MediaPost[] = [
  {
    id: "night-market",
    kind: "photo",
    caption: "The lane lights up after eight.",
    imageUrl: photo("photo-1555396273-367ea4eb4db5"),
    videoUrl: "",
  },
  {
    id: "river-ferry",
    kind: "photo",
    caption: "Last ferry, still warm.",
    imageUrl: photo("photo-1508009603885-50cf7c579365"),
    videoUrl: "",
  },
  {
    id: "platform",
    kind: "video",
    caption: "A minute on the platform before the train.",
    imageUrl: photo("photo-1474487548417-781cb71495f3"),
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "morning-bowl",
    kind: "photo",
    caption: "Breakfast before the city is loud.",
    imageUrl: photo("photo-1504674900247-0877df9cc836"),
    videoUrl: "",
  },
  {
    id: "courtyard",
    kind: "photo",
    caption: "Dusk in the courtyard.",
    imageUrl: photo("photo-1528183429752-a97d0bf99b5a"),
    videoUrl: "",
  },
  {
    id: "hill-road",
    kind: "glimpse",
    caption: "The road into the hills.",
    imageUrl: photo("photo-1469854523086-cc02fe5d8800"),
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "night-bus",
    kind: "glimpse",
    caption: "Window seat, city dropping away.",
    imageUrl: photo("photo-1544620341-11cb2cd7c626"),
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
];

export const seedPieces: StudioPiece[] = [
  {
    id: "slow-south",
    kind: "story",
    title: "A slow week in the south",
    summary: "One coast, two towns, and the ferries between them.",
    status: "published",
  },
  {
    id: "river-room",
    kind: "spot",
    title: "The River Room",
    summary: "A low hotel that faces the water. Ask for the terrace room.",
    status: "published",
  },
  {
    id: "four-days",
    kind: "itinerary",
    title: "Four days, river then hills",
    summary: "City mornings, one canal afternoon, a mountain terrace on the last day.",
    status: "draft",
  },
  {
    id: "how-i-pack",
    kind: "blog",
    title: "What I actually pack for a night train",
    summary: "A short note on the bag that fits the overhead rack.",
    status: "draft",
  },
];

let posts = seedPosts;
let pieces = seedPieces;
const listeners = new Set<() => void>();

export function subscribeStudio(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function postsSnapshot() {
  return posts;
}

export function postsServerSnapshot() {
  return seedPosts;
}

export function piecesSnapshot() {
  return pieces;
}

export function piecesServerSnapshot() {
  return seedPieces;
}

export function savePost(post: MediaPost) {
  posts = [post, ...posts];
  listeners.forEach((listener) => listener());
}

export function savePiece(piece: StudioPiece) {
  pieces = pieces.some((item) => item.id === piece.id)
    ? pieces.map((item) => (item.id === piece.id ? piece : item))
    : [piece, ...pieces];
  listeners.forEach((listener) => listener());
}
