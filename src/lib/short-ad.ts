export type ShortAd = {
  id: string;
  sponsor: string;
  headline: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
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
  const headline = typeof item.headline === "string" ? item.headline.trim() : "";
  const ctaUrlRaw = typeof item.ctaUrl === "string" ? item.ctaUrl : "";
  const ctaUrl = resolveAdCtaUrl(ctaUrlRaw);
  if (!id || !headline || !ctaUrl) return null;
  const ctaLabel =
    typeof item.ctaLabel === "string" && item.ctaLabel.trim() ? item.ctaLabel.trim() : "Learn more";
  return {
    id,
    sponsor: sponsor || "Sponsored",
    headline,
    body: typeof item.body === "string" ? item.body.trim() : undefined,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl.trim() : undefined,
    videoUrl: typeof item.videoUrl === "string" ? item.videoUrl.trim() : undefined,
    ctaLabel,
    ctaUrl,
  };
}

export function normalizeShortAds(raw: unknown): ShortAd[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeShortAd).filter((ad): ad is ShortAd => ad !== null);
}

export const defaultShortAds: ShortAd[] = [
  {
    id: "ad-travelhues-explore",
    sponsor: "Travelhues",
    headline: "Stories from people on the road",
    body: "Follow creators, save finds, and plan trips in one place.",
    ctaLabel: "Start exploring",
    ctaUrl: "/",
  },
  {
    id: "ad-travelhues-signin",
    sponsor: "Travelhues",
    headline: "Save hues and follow creators",
    body: "Sign in free to like, save, and keep scrolling.",
    ctaLabel: "Sign in",
    ctaUrl: "/login/user?next=/hues",
  },
];
