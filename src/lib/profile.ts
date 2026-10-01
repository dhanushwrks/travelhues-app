import type { Story } from "@/lib/types";

export type SocialLink = {
  platform: string;
  url: string;
};

export type Person = {
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  country: string;
  countriesTraveled: string[];
  hobbies: string[];
  socials: SocialLink[];
  avatarUrl: string;
  coverUrl: string;
  /** TCC introduction clip (≤30s). Empty when unset. */
  introVideoUrl?: string;
  role: "tcc" | "traveler" | "admin";
  hidden: boolean;
  counts: { stories: number; spots: number; itineraries: number };
  stories: Story[];
  email?: string;
  dateOfBirth?: string;
  hasPassword?: boolean;
  canChangeUsername?: boolean;
};

export const platforms = [
  ["youtube", "YouTube"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
  ["website", "Website"],
] as const;

export type PlatformId = (typeof platforms)[number][0];

export const platformIds = new Set<string>(platforms.map(([id]) => id));

export const platformPlaceholders: Record<PlatformId, string> = {
  youtube: "youtube.com/@you",
  instagram: "instagram.com/you",
  facebook: "facebook.com/you",
  linkedin: "linkedin.com/in/you",
  website: "yoursite.com",
};

export function normalizeSocials(links: SocialLink[]): SocialLink[] {
  return links.map((link) => ({
    ...link,
    platform: platformIds.has(link.platform) ? link.platform : "youtube",
  }));
}
