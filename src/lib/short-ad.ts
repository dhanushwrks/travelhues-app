export type ShortAd = {
  id: string;
  /** Legacy label; shown with “Sponsored” when `partnerName` matches. */
  sponsor: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  category: string;
  /** Short title for the highlight clip (shown like a hue caption). */
  headline: string;
  body?: string;
  /** 9:16 poster frame for the highlight. */
  imageUrl?: string;
  /** 9:16 highlight video; loops like a hue. `imageUrl` is the poster when set. */
  videoUrl?: string;
  streamUrl?: string;
  ctaLabel: string;
  ctaUrl: string;
};

/** Insert one ad after every N hue videos in the vertical feed. */
export const HUES_AD_INTERVAL = 3;

export function resolveAdCtaUrl(raw: string) {
  const url = raw.trim();
  if (!url) return "/";
  if (url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function normalizeShortAd(raw: unknown): ShortAd | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const sponsor = typeof item.sponsor === "string" ? item.sponsor.trim() : "";
  const partnerName =
    typeof item.partnerName === "string" && item.partnerName.trim()
      ? item.partnerName.trim()
      : sponsor;
  const category =
    typeof item.category === "string" && item.category.trim() ? item.category.trim() : "Partner";
  const headline = typeof item.headline === "string" ? item.headline.trim() : "";
  const ctaUrlRaw = typeof item.ctaUrl === "string" ? item.ctaUrl : "";
  const ctaUrl = resolveAdCtaUrl(ctaUrlRaw);
  if (!id || !headline || !ctaUrl || !partnerName) return null;
  const imageUrl = typeof item.imageUrl === "string" ? item.imageUrl.trim() : undefined;
  const videoUrl = typeof item.videoUrl === "string" ? item.videoUrl.trim() : undefined;
  if (!imageUrl && !videoUrl) return null;
  const ctaLabel =
    typeof item.ctaLabel === "string" && item.ctaLabel.trim() ? item.ctaLabel.trim() : "Learn more";
  const partnerAvatarUrl =
    typeof item.partnerAvatarUrl === "string" ? item.partnerAvatarUrl.trim() : undefined;
  return {
    id,
    sponsor: sponsor || partnerName,
    partnerName,
    partnerAvatarUrl: partnerAvatarUrl || undefined,
    category,
    headline,
    body: typeof item.body === "string" ? item.body.trim() : undefined,
    imageUrl: imageUrl || undefined,
    videoUrl: videoUrl || undefined,
    ctaLabel,
    ctaUrl,
  };
}

export function normalizeShortAds(raw: unknown): ShortAd[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeShortAd).filter((ad): ad is ShortAd => ad !== null);
}

const seedPoster916 = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1080&h=1920&q=80`;

const seedAvatar = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&h=200&q=80`;

export const defaultShortAds: ShortAd[] = [
  {
    id: "seed-harbor-house",
    sponsor: "Harbor House",
    partnerName: "Harbor House",
    partnerAvatarUrl: seedAvatar("photo-1564501049412-61c2a3083791"),
    category: "Stay",
    headline: "Rooms above the old town",
    body: "Creator-picked boutique stays. Free cancel on most nights.",
    imageUrl: seedPoster916("photo-1566073771259-6a8506099945"),
    ctaLabel: "Book now",
    ctaUrl: "https://example.com/harbor-house",
  },
  {
    id: "seed-monsoon-market",
    sponsor: "Monsoon Market",
    partnerName: "Monsoon Market",
    partnerAvatarUrl: seedAvatar("photo-1486406146926-c627a92ad1ab"),
    category: "Shop",
    headline: "Market finds in your carry-on",
    body: "Handloom, spices, and gifts from the stalls creators film.",
    imageUrl: seedPoster916("photo-1441986300917-6466bd6e608f"),
    ctaLabel: "Shop now",
    ctaUrl: "https://example.com/monsoon-market",
  },
  {
    id: "seed-clay-pot",
    sponsor: "Clay Pot Kitchen",
    partnerName: "Clay Pot Kitchen",
    partnerAvatarUrl: seedAvatar("photo-1559339352-11d035aa65de"),
    category: "Food",
    headline: "The table from the hue",
    body: "Book the tasting menus tagged in creator finds.",
    imageUrl: seedPoster916("photo-1414235077428-338989a2e8c0"),
    ctaLabel: "Book now",
    ctaUrl: "https://example.com/clay-pot",
  },
  {
    id: "seed-trail-co",
    sponsor: "Trail & Co",
    partnerName: "Trail & Co",
    partnerAvatarUrl: seedAvatar("photo-1521577352947-9bb58764a69f"),
    category: "Gear",
    headline: "Pack for the next scroll",
    body: "Day packs and trail shoes for humid cities and ridge walks.",
    imageUrl: seedPoster916("photo-1553062407-98eeb64c6a62"),
    ctaLabel: "Shop now",
    ctaUrl: "https://example.com/trail-co",
  },
  {
    id: "seed-sunrise-tours",
    sponsor: "Sunrise Tours",
    partnerName: "Sunrise Tours",
    partnerAvatarUrl: seedAvatar("photo-1501785888041-caed747fb007"),
    category: "Experience",
    headline: "Small groups, local guides",
    body: "Half-day walks and boat rides tied to stories in your feed.",
    imageUrl: seedPoster916("photo-1506905925346-21bda4d32df4"),
    ctaLabel: "Book now",
    ctaUrl: "https://example.com/sunrise-tours",
  },
  {
    id: "seed-travelhues",
    sponsor: "Travelhues",
    partnerName: "Travelhues",
    partnerAvatarUrl: seedAvatar("photo-1469854523086-cc02fe5d8800"),
    category: "Platform",
    headline: "Like, save, and keep scrolling",
    body: "Free traveler account. Pick up where you left off on Hues.",
    imageUrl: seedPoster916("photo-1476514525535-07fb3f4b272a"),
    ctaLabel: "Sign in",
    ctaUrl: "/login/user?next=/hues",
  },
];
