"use client";

import { useEffect, useSyncExternalStore } from "react";

import { apiBase, apiMessage, mediaUrl } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { countryName } from "@/lib/countries";
import { fetchSpotCatalog } from "@/lib/spot-catalog";
import { packDescription, unpackDescription } from "@/lib/spot-copy";
import {
  type CreatorStory,
  type PlanBlock,
  type PlanDay,
  type StoryBlog,
  type StoryPlan,
  type StorySpot,
} from "@/lib/mock/studio";
import type { Spot, Story } from "@/lib/types";

const emptyStories: CreatorStory[] = [];
const listeners = new Set<() => void>();

type Status = "idle" | "loading" | "ready" | "error";

let stories: CreatorStory[] = emptyStories;
let status: Status = "idle";
let problem = "";
let generation = 0;
let inflight: Promise<void> | null = null;

const centers: Record<string, { lat: number; lng: number }> = {
  TH: { lat: 15.87, lng: 100.99 },
  IN: { lat: 22.5, lng: 79 },
};

const difficulties = new Set(["Easy", "Moderate", "Hard"]);
const seasons = new Set(["Year round", "Dry months", "Cool months", "Monsoon"]);
const ages = new Set(["All ages", "Families", "Adults"]);
let kindLabels = new Set([
  "Hotel",
  "Guesthouse",
  "Homestay",
  "Restaurant",
  "Cafe",
  "Street food",
  "Trek",
  "Class",
  "Boat",
  "Walk",
  "Temple",
  "Viewpoint",
  "Neighborhood",
  "Market",
  "Boutique",
]);

export function subscribeDesk(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function deskStories() {
  return stories;
}

export function deskStoriesServer() {
  return emptyStories;
}

export function deskStatus() {
  return status;
}

export function deskStatusServer(): Status {
  return "idle";
}

export function deskProblem() {
  return problem;
}

export function deskProblemServer() {
  return "";
}

export function useDesk() {
  const list = useSyncExternalStore(subscribeDesk, deskStories, deskStoriesServer);
  const state = useSyncExternalStore(subscribeDesk, deskStatus, deskStatusServer);
  const message = useSyncExternalStore(subscribeDesk, deskProblem, deskProblemServer);
  useEffect(() => {
    void refreshDesk();
  }, []);
  return { stories: list, status: state, problem: message };
}

export function refreshDesk() {
  if (inflight) return inflight;
  const token = readCookie("th_access");
  status = "loading";
  problem = "";
  emit();
  inflight = pull(token).finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function createDeskStory(input: {
  country: string;
  title: string;
  about: string;
  coverUrl: string;
}) {
  const token = tokenOrThrow();
  const coverUrl = await uploadImage(token, input.coverUrl);
  const place = centers[input.country] ?? { lat: 13.75, lng: 100.5 };
  const story = await send<Story>(token, "/stories", {
    slug: slugify(input.title, "story"),
    title: input.title,
    summary: input.about,
    coverUrl,
    destination: {
      name: countryName(input.country),
      country: input.country,
      lat: place.lat,
      lng: place.lng,
    },
  });
  remember([toDesk(story), ...stories.filter((item) => item.id !== story.slug)]);
  return story.slug;
}

export async function createDeskSpot(
  storyId: string,
  spot: Omit<StorySpot, "id"> & { lat: number; lng: number },
) {
  const token = tokenOrThrow();
  const images = [];
  for (const image of spot.images) images.push(await uploadImage(token, image));
  await send(token, `/stories/${storyId}/spots`, {
    id: slugify(spot.title, "spot"),
    type: spot.category,
    title: spot.title,
    description: packDescription(spot.summary, spot.tips, spot.affiliateUrl, spot.referenceUrl),
    images,
    lat: spot.lat,
    lng: spot.lng,
    address: spot.placeName,
    avgMinutes: toMinutes(spot.duration),
    avgCostThb: toCost(spot.cost),
    tags: [spot.subcategory, spot.difficulty, spot.season, spot.ageGroup].filter(Boolean),
  });
  await pull(token);
}

export async function createDeskPlan(storyId: string, plan: Omit<StoryPlan, "id">) {
  const token = tokenOrThrow();
  const story = stories.find((item) => item.id === storyId);
  const images = [];
  for (const image of plan.images) images.push(await uploadImage(token, image));
  const coverUrl = images[0] || story?.coverUrl;
  if (!coverUrl) throw new Error("Add a cover picture for the plan");
  await send(token, `/stories/${storyId}/itineraries`, {
    slug: slugify(plan.title, "plan"),
    title: plan.title,
    summary: plan.summary,
    coverUrl,
    days: plan.days.map((day) => ({
      title: day.title,
      blocks: day.blocks.map((block) => toBlock(block, story?.spots ?? [])),
    })),
  });
  await pull(token);
}

export async function addDeskBlog(storyId: string, blog: StoryBlog) {
  const token = tokenOrThrow();
  let coverUrl = blog.coverUrl ?? "";
  if (coverUrl && !coverUrl.startsWith("http://") && !coverUrl.startsWith("https://")) {
    coverUrl = await uploadImage(token, coverUrl);
  }
  await send(token, `/stories/${storyId}/blogs`, {
    slug: slugify(blog.title, "blog"),
    title: blog.title,
    body: blog.body,
    coverUrl,
  });
  await pull(token);
}

async function pull(token: string) {
  const catalog = await fetchSpotCatalog();
  kindLabels = new Set(catalog.flatMap((item) => item.kinds));
  const seen = ++generation;
  if (!token) {
    status = "error";
    problem = "Sign in to continue";
    emit();
    return;
  }
  try {
    const response = await fetch(`${apiBase}/me/stories`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await apiMessage(response));
    const body = (await response.json()) as Story[];
    if (seen !== generation) return;
    apply(body.map(toDesk));
  } catch (caught) {
    if (seen !== generation) return;
    status = "error";
    problem = caught instanceof Error ? caught.message : "Could not load your stories";
    emit();
  }
}

function remember(next: CreatorStory[]) {
  generation += 1;
  apply(next);
}

function apply(next: CreatorStory[]) {
  stories = next;
  status = "ready";
  problem = "";
  emit();
}

async function send<T>(token: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await apiMessage(response));
  return (await response.json()) as T;
}

async function uploadImage(token: string, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const saved = await send<{ url: string }>(token, "/media", { dataUrl: value });
  return mediaUrl(saved.url);
}

function toDesk(story: Story): CreatorStory {
  const country = /^[A-Za-z]{2}$/.test(story.destination.country)
    ? story.destination.country.toUpperCase()
    : story.destination.country;
  return {
    id: story.slug,
    country,
    title: story.title,
    about: story.summary,
    coverUrl: mediaUrl(story.coverUrl),
    videoUrl: "",
    spots: story.spots.map(toSpot),
    plans: story.itineraries.map((plan) => toPlan(plan)),
    blogs: (story.blogs ?? []).map((blog) => ({
      id: blog.slug,
      title: blog.title,
      body: blog.body,
      coverUrl: blog.coverUrl ? mediaUrl(blog.coverUrl) : "",
    })),
  };
}

function toSpot(spot: Spot): StorySpot {
  const notes = unpackDescription(spot.description);
  const tags = [...spot.tags];
  const take = (known: Set<string>) => {
    const index = tags.findIndex((tag) => known.has(tag));
    if (index < 0) return "";
    return tags.splice(index, 1)[0] ?? "";
  };
  const subcategory = take(kindLabels);
  const difficulty = take(difficulties);
  const season = take(seasons);
  const ageGroup = take(ages);
  return {
    id: spot.id,
    title: spot.title,
    summary: notes.summary,
    category: spot.type,
    subcategory,
    placeName: spot.address,
    lat: spot.lat,
    lng: spot.lng,
    images: spot.images.map(mediaUrl),
    duration: spot.avgMinutes > 0 ? `${spot.avgMinutes} min` : "",
    cost: spot.avgCostThb > 0 ? String(spot.avgCostThb) : "",
    difficulty,
    season,
    ageGroup,
    affiliateUrl: notes.affiliate,
    referenceUrl: notes.reference,
    tips: notes.tips,
  };
}

function toPlan(plan: Story["itineraries"][number]): StoryPlan {
  return {
    id: plan.slug,
    title: plan.title,
    summary: plan.summary,
    images: plan.coverUrl ? [mediaUrl(plan.coverUrl)] : [],
    days: plan.days.map((day, index) => toDay(day, index)),
  };
}

function toDay(day: Story["itineraries"][number]["days"][number], index: number): PlanDay {
  return {
    id: `day-${index + 1}`,
    title: day.title,
    blocks: day.blocks.map((block, blockIndex) => {
      if (block.kind === "note") {
        return { id: `note-${index}-${blockIndex}`, kind: "note", body: block.body, minutes: "" };
      }
      return { id: `stop-${index}-${blockIndex}`, kind: "stop", spotId: block.spotId };
    }),
  };
}

function toBlock(block: PlanBlock, spots: StorySpot[]) {
  if (block.kind === "note") return { kind: "note" as const, body: block.body };
  const title = spots.find((spot) => spot.id === block.spotId)?.title ?? "Stop";
  return { kind: "spot" as const, spotId: block.spotId, body: title };
}

function toMinutes(value: string) {
  const match = value.trim().match(/^(\d+)/);
  if (!match) return 0;
  const amount = Number(match[1]);
  return /hour/i.test(value) ? amount * 60 : amount;
}

function toCost(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function slugify(title: string, prefix: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || prefix}-${Date.now().toString(36)}`;
}

function tokenOrThrow() {
  const token = readCookie("th_access");
  if (!token) throw new Error("Sign in to continue");
  return token;
}

function emit() {
  listeners.forEach((listener) => listener());
}
