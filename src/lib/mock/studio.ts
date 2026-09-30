const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export type MediaKind = "photo" | "video" | "glimpse";

export type PostMedia = {
  kind: "photo" | "video";
  imageUrl: string;
  videoUrl: string;
};

export type PostComment = {
  id: string;
  author: string;
  body: string;
};

export type PostBoard = {
  liked: boolean;
  likes: number;
  comments: PostComment[];
};

export type MediaPost = {
  id: string;
  kind: MediaKind;
  caption: string;
  imageUrl: string;
  videoUrl: string;
  media?: PostMedia[];
};

export const spotCategories = ["stay", "food", "activity", "sightseeing", "shop"] as const;

export type SpotCategory = (typeof spotCategories)[number];

export function categoryName(slug: string) {
  return slug in categoryLabel ? categoryLabel[slug as SpotCategory] : slug;
}

export const categoryLabel: Record<SpotCategory, string> = {
  stay: "Stay",
  food: "Food",
  activity: "Activity",
  sightseeing: "Sightseeing",
  shop: "Shop",
};

export const subcategories: Record<SpotCategory, string[]> = {
  stay: ["Hotel", "Guesthouse", "Homestay"],
  food: ["Restaurant", "Cafe", "Street food"],
  activity: ["Trek", "Class", "Boat", "Walk"],
  sightseeing: ["Temple", "Viewpoint", "Neighborhood"],
  shop: ["Market", "Boutique"],
};

export type StorySpot = {
  id: string;
  title: string;
  summary: string;
  category: string;
  subcategory: string;
  placeName: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  duration: string;
  cost: string;
  difficulty: string;
  season: string;
  ageGroup: string;
  affiliateUrl: string;
  referenceUrl: string;
  tips: string;
};

export type PlanNote = {
  id: string;
  kind: "note";
  body: string;
  minutes: string;
};

export type PlanStop = {
  id: string;
  kind: "stop";
  spotId: string;
};

export type PlanBlock = PlanNote | PlanStop;

export type PlanDay = {
  id: string;
  title: string;
  blocks: PlanBlock[];
};

export type StoryPlan = {
  id: string;
  title: string;
  summary: string;
  images: string[];
  days: PlanDay[];
};

export type StoryBlog = {
  id: string;
  title: string;
  body: string;
  coverUrl?: string;
};

const blogTags = /^(p|h2|strong|em|u|ul|ol|li|blockquote|a|br)$/i;

export function blogMarkup(html: string) {
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
    if (!blogTags.test(tag)) return "";
    const name = tag.toLowerCase();
    if (name === "br") return "<br>";
    if (match.startsWith("</")) return `</${name}>`;
    if (name !== "a") return `<${name}>`;
    const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
    if (!/^https:\/\//i.test(href)) return "<a>";
    return `<a href="${href}" rel="noopener noreferrer" target="_blank">`;
  });
}

export function blogExcerpt(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export type CreatorStory = {
  id: string;
  country: string;
  title: string;
  about: string;
  coverUrl: string;
  videoUrl: string;
  spots: StorySpot[];
  plans: StoryPlan[];
  blogs: StoryBlog[];
};

export type StoryTab = "spots" | "plans" | "blogs";

export const storefrontBio =
  "I film the road as it happens, from night markets to slow trains, and leave the route so someone else can walk it.";

export const seedPosts: MediaPost[] = [
  {
    id: "night-market",
    kind: "photo",
    caption: "The lane lights up after eight.",
    imageUrl: photo("photo-1555396273-367ea4eb4db5"),
    videoUrl: "",
    media: [
      { kind: "photo", imageUrl: photo("photo-1555396273-367ea4eb4db5"), videoUrl: "" },
      { kind: "photo", imageUrl: photo("photo-1508009603885-50cf7c579365"), videoUrl: "" },
      { kind: "photo", imageUrl: photo("photo-1559339352-11d035aa65de"), videoUrl: "" },
    ],
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

export const seedStories: CreatorStory[] = [
  {
    id: "slow-south",
    country: "IN",
    title: "The long way south",
    about:
      "A week between the river towns, with one hill stop in the middle and a night train when the road gets dull.",
    coverUrl: photo("photo-1508009603885-50cf7c579365"),
    videoUrl: "",
    spots: [
      {
        id: "fort-lane",
        title: "Fort lane breakfast",
        summary: "The counter opens at seven. Sit outside before the tour groups arrive.",
        category: "food",
        subcategory: "Cafe",
        placeName: "Fort lane",
        lat: 9.93,
        lng: 76.26,
        images: [photo("photo-1504674900247-0877df9cc836")],
        duration: "45 min",
        cost: "180",
        difficulty: "",
        season: "",
        ageGroup: "",
        affiliateUrl: "",
        referenceUrl: "",
        tips: "",
      },
    ],
    plans: [
      {
        id: "five-days",
        title: "Five days along the coast",
        summary: "River mornings first, then one hill day before the train home.",
        images: [photo("photo-1507525428034-b723cf961d3e")],
        days: [
          {
            id: "arrival",
            title: "Arrival on the coast",
            blocks: [{ id: "breakfast", kind: "stop", spotId: "fort-lane" }],
          },
          { id: "river", title: "The river towns", blocks: [] },
          { id: "hill", title: "One hill day", blocks: [] },
          { id: "market", title: "The night market", blocks: [] },
          { id: "train", title: "The train home", blocks: [] },
        ],
      },
    ],
    blogs: [
      {
        id: "night-train",
        title: "What I pack for a night train",
        body: "<p>A short note on the bag that fits the overhead rack.</p>",
      },
    ],
  },
];

let serial = 0;

export function nextPieceId(prefix: string) {
  serial += 1;
  return `${prefix}-${serial}`;
}

export type PlanDraft = {
  title: string;
  summary: string;
  images: string[];
  days: PlanDay[];
  active: number;
};

let planDraft: { storyId: string; draft: PlanDraft } | null = null;

export function writePlanDraft(storyId: string, draft: PlanDraft) {
  planDraft = { storyId, draft };
  listeners.forEach((listener) => listener());
}

export function clearPlanDraft(storyId: string) {
  if (planDraft?.storyId !== storyId) return;
  planDraft = null;
  listeners.forEach((listener) => listener());
}

export function planDraftSnapshot(storyId: string) {
  return planDraft?.storyId === storyId ? planDraft.draft : null;
}

export function planDraftServerSnapshot() {
  return null;
}

let posts = seedPosts;
let stories = seedStories;
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

export function storiesSnapshot() {
  return stories;
}

export function storiesServerSnapshot() {
  return seedStories;
}

export function savePost(post: MediaPost) {
  posts = [post, ...posts];
  listeners.forEach((listener) => listener());
}

const boards = new Map<string, PostBoard>();

export function postBoard(id: string): PostBoard {
  const current = boards.get(id);
  if (current) return current;
  const next: PostBoard = { liked: false, likes: 0, comments: [] };
  boards.set(id, next);
  return next;
}

export function togglePostLike(id: string) {
  const current = postBoard(id);
  boards.set(id, {
    ...current,
    liked: !current.liked,
    likes: current.likes + (current.liked ? -1 : 1),
  });
  listeners.forEach((listener) => listener());
}

export function addPostComment(id: string, author: string, body: string) {
  const current = postBoard(id);
  boards.set(id, {
    ...current,
    comments: [...current.comments, { id: `comment-${Date.now()}`, author, body }],
  });
  listeners.forEach((listener) => listener());
}

export function saveStory(story: CreatorStory) {
  stories = [story, ...stories];
  listeners.forEach((listener) => listener());
}

export function addToStory(
  storyId: string,
  patch: { spot?: StorySpot; plan?: StoryPlan; blog?: StoryBlog },
) {
  stories = stories.map((story) => {
    if (story.id !== storyId) return story;
    return {
      ...story,
      spots: patch.spot ? [patch.spot, ...story.spots] : story.spots,
      plans: patch.plan ? [patch.plan, ...story.plans] : story.plans,
      blogs: patch.blog ? [patch.blog, ...story.blogs] : story.blogs,
    };
  });
  listeners.forEach((listener) => listener());
}
