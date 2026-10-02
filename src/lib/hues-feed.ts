import type { Glimpse } from "@/lib/glimpse";
import { HUES_AD_INTERVAL, type ShortAd } from "@/lib/short-ad";

export type HuesFeedItem =
  | { kind: "glimpse"; glimpse: Glimpse }
  | { kind: "ad"; ad: ShortAd };

export function buildHuesFeed(glimpses: Glimpse[], ads: ShortAd[]): HuesFeedItem[] {
  const pool = ads.filter(
    (ad) => ad.id && ad.headline && ad.ctaUrl && ad.ctaLabel && ad.partnerName && ad.category,
  );
  if (pool.length === 0) {
    return glimpses.map((glimpse) => ({ kind: "glimpse", glimpse }));
  }

  const feed: HuesFeedItem[] = [];
  let adCursor = 0;
  for (let index = 0; index < glimpses.length; index += 1) {
    feed.push({ kind: "glimpse", glimpse: glimpses[index] });
    if ((index + 1) % HUES_AD_INTERVAL === 0) {
      feed.push({ kind: "ad", ad: pool[adCursor % pool.length] });
      adCursor += 1;
    }
  }
  return feed;
}

export function feedStartIndex(feed: HuesFeedItem[], glimpseId: string) {
  const index = feed.findIndex((item) => item.kind === "glimpse" && item.glimpse.id === glimpseId);
  return index >= 0 ? index : 0;
}
