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
  role: "tcc" | "traveler";
  hidden: boolean;
  counts: { stories: number; spots: number; itineraries: number };
  stories: Story[];
  email?: string;
  dateOfBirth?: string;
};

export const platforms = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["x", "X"],
  ["tiktok", "TikTok"],
  ["website", "Website"],
] as const;
