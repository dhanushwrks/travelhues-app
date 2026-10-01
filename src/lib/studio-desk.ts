"use client";

import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

import { apiBase, apiMessage, mediaUrl } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import { countryName } from "@/lib/countries";
import { fetchSpotCatalog } from "@/lib/spot-catalog";
import { packDescription, unpackDescription } from "@/lib/spot-copy";
import {
  type CreatorStory,
  type PlanBlock,
  type PlanDay,
  type PlanReservation,
  type StoryBlog,
  type StoryPlan,
  type StorySpot,
} from "@/lib/mock/studio";
import { spotTypes, type Itinerary, type Reservation, type Spot, type Story } from "@/lib/types";

const DeskHomeContext = createContext("/studio");

export function DeskScope({ home, children }: { home: string; children: ReactNode }) {
  return createElement(DeskHomeContext.Provider, { value: home }, children);
}

export function useDeskHome() {
  return useContext(DeskHomeContext);
}

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

export async function updateDeskStory(
  storyId: string,
  input: {
    country: string;
    title: string;
    about: string;
    coverUrl: string;
  },
) {
  const token = tokenOrThrow();
  const coverUrl = await uploadImage(token, input.coverUrl);
  const place = centers[input.country] ?? { lat: 13.75, lng: 100.5 };
  await send(
    token,
    `/stories/${storyId}`,
    {
      title: input.title,
      summary: input.about,
      coverUrl,
      destination: {
        name: countryName(input.country),
        country: input.country,
        lat: place.lat,
        lng: place.lng,
      },
    },
    "PUT",
  );
  await pull(token);
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
      brief: day.brief.trim() || undefined,
      blocks: day.blocks.map((block) => toBlock(block, story?.spots ?? [])),
    })),
    reservations: plan.reservations.map(toPublicReservation),
  });
  await pull(token);
}

export async function updateDeskPlan(storyId: string, planId: string, plan: Omit<StoryPlan, "id">) {
  const token = tokenOrThrow();
  const story = stories.find((item) => item.id === storyId);
  const images = [];
  for (const image of plan.images) images.push(await uploadImage(token, image));
  const coverUrl = images[0] || story?.coverUrl;
  if (!coverUrl) throw new Error("Add a cover picture for the plan");
  await send(
    token,
    `/stories/${storyId}/itineraries/${planId}`,
    {
      title: plan.title,
      summary: plan.summary,
      coverUrl,
      days: plan.days.map((day) => ({
        title: day.title,
        brief: day.brief.trim() || undefined,
        blocks: day.blocks.map((block) => toBlock(block, story?.spots ?? [])),
      })),
      reservations: plan.reservations.map(toPublicReservation),
    },
    "PUT",
  );
  await pull(token);
}

export async function setDeskArchived(
  storyId: string,
  kind: "spots" | "plans" | "blogs" | "story",
  id: string,
  archived: boolean,
) {
  const token = tokenOrThrow();
  if (kind === "story") {
    await send(token, `/stories/${storyId}/archive`, { archived });
  } else {
    const path = kind === "plans" ? "itineraries" : kind;
    await send(token, `/stories/${storyId}/${path}/${id}/archive`, { archived });
  }
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

export async function updateDeskBlog(storyId: string, blogId: string, blog: StoryBlog) {
  const token = tokenOrThrow();
  let coverUrl = blog.coverUrl ?? "";
  if (coverUrl && !coverUrl.startsWith("http://") && !coverUrl.startsWith("https://")) {
    coverUrl = await uploadImage(token, coverUrl);
  }
  await send(
    token,
    `/stories/${storyId}/blogs/${blogId}`,
    { title: blog.title, body: blog.body, coverUrl },
    "PUT",
  );
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

async function send<T>(token: string, path: string, body: unknown, method: "POST" | "PUT" = "POST"): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method,
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
    archived: story.archived ?? false,
    spots: story.spots.map(toSpot),
    plans: story.itineraries.map((plan) => toPlan(plan)),
    blogs: (story.blogs ?? []).map((blog) => ({
      id: blog.slug,
      title: blog.title,
      body: blog.body,
      coverUrl: blog.coverUrl ? mediaUrl(blog.coverUrl) : "",
      archived: blog.archived ?? false,
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
    archived: spot.archived ?? false,
  };
}

function toPlan(plan: Story["itineraries"][number]): StoryPlan {
  const migrated = migrateBlockReservations(plan);
  return {
    id: plan.slug,
    title: plan.title,
    summary: plan.summary,
    images: plan.coverUrl ? [mediaUrl(plan.coverUrl)] : [],
    days: plan.days.map((day, index) => toDay(day, index)),
    reservations: mergedReservations(plan.reservations, migrated),
    archived: plan.archived ?? false,
  };
}

function mergedReservations(
  fromApi: Reservation[] | undefined,
  migrated: PlanReservation[],
): PlanReservation[] {
  const mapped = (fromApi ?? []).map(fromPublicReservation);
  if (mapped.length > 0) return mapped;
  return migrated;
}

function migrateBlockReservations(plan: Story["itineraries"][number]): PlanReservation[] {
  const items: PlanReservation[] = [];
  plan.days.forEach((day, dayIndex) => {
    (day.blocks as unknown as Array<Record<string, unknown>>).forEach((raw, blockIndex) => {
      if (raw.kind !== "reservation") return;
      const type = normalizeReservationType(typeof raw.type === "string" ? raw.type : undefined);
      const details =
        raw.details && typeof raw.details === "object"
          ? (raw.details as Record<string, string>)
          : {};
      items.push({
        id: `migrated-${dayIndex}-${blockIndex}`,
        type,
        title: typeof raw.title === "string" ? raw.title : "Suggestion",
        spotId: typeof raw.spotId === "string" ? raw.spotId : "",
        fromDay: dayIndex,
        toDay: dayIndex,
        fromPlace: details.from ?? "",
        toPlace: details.to ?? "",
        rentalKind: type === "rental" ? "car" : "",
        estCost: "",
        link: typeof raw.link === "string" ? raw.link : "",
        notes: typeof raw.notes === "string" ? raw.notes : "",
        airline: details.airline ?? "",
        flightNumber: details.flightNumber ?? "",
        timeOfDay: "",
      });
    });
  });
  return items;
}

function normalizeReservationType(value?: string): PlanReservation["type"] {
  if (value === "hotel" || value === "stay") return "stay";
  if (value === "car" || value === "rental") return "rental";
  if (value === "flight" || value === "experience") return value;
  return "experience";
}

function fromPublicReservation(item: Reservation): PlanReservation {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    spotId: item.spotId ?? "",
    fromDay: item.fromDay,
    toDay: item.toDay,
    fromPlace: item.fromPlace ?? "",
    toPlace: item.toPlace ?? "",
    rentalKind: item.rentalKind ?? "",
    estCost: item.estCostThb != null && item.estCostThb > 0 ? String(item.estCostThb) : "",
    link: item.link ?? "",
    notes: item.notes ?? "",
    airline: item.airline ?? "",
    flightNumber: item.flightNumber ?? "",
    timeOfDay: item.timeOfDay ?? "",
  };
}

function toPublicReservation(item: PlanReservation): Reservation {
  return {
    id: item.id,
    type: item.type,
    title: item.title.trim(),
    spotId: item.spotId.trim() || undefined,
    fromDay: item.fromDay,
    toDay: Math.max(item.fromDay, item.toDay),
    fromPlace: item.fromPlace.trim() || undefined,
    toPlace: item.toPlace.trim() || undefined,
    rentalKind: item.rentalKind || undefined,
    estCostThb: toCost(item.estCost) || undefined,
    link: item.link.trim() || undefined,
    notes: item.notes.trim() || undefined,
    airline: item.airline.trim() || undefined,
    flightNumber: item.flightNumber.trim() || undefined,
    timeOfDay: item.timeOfDay.trim() || undefined,
  };
}

function toDay(day: Story["itineraries"][number]["days"][number], index: number): PlanDay {
  const blocks: PlanBlock[] = [];
  day.blocks.forEach((block, blockIndex) => {
    if (block.kind === "note") {
      blocks.push({ id: `note-${index}-${blockIndex}`, kind: "note", body: block.body, minutes: "" });
      return;
    }
    if (block.kind === "spot") {
      blocks.push({
        id: `stop-${index}-${blockIndex}`,
        kind: "stop",
        spotId: block.spotId,
        commute: block.commute
          ? {
              mode: block.commute.mode,
              notes: block.commute.notes ?? "",
              minutes: block.commute.minutes != null ? String(block.commute.minutes) : "",
              cost: block.commute.costThb != null && block.commute.costThb > 0 ? String(block.commute.costThb) : "",
              mapsMinutes: block.commute.mapsMinutes,
              mapsDistanceM: block.commute.mapsDistanceM,
              minutesSource: block.commute.minutesSource,
            }
          : undefined,
      });
    }
  });
  return {
    id: `day-${index + 1}`,
    title: day.title,
    brief: day.brief ?? "",
    blocks,
  };
}

function toBlock(block: PlanBlock, spots: StorySpot[]) {
  if (block.kind === "note") return { kind: "note" as const, body: block.body };
  const title = spots.find((spot) => spot.id === block.spotId)?.title ?? "Stop";
  const commute = block.commute
    ? {
        mode: block.commute.mode,
        notes: block.commute.notes.trim() || undefined,
        minutes: Number.parseInt(block.commute.minutes, 10) || undefined,
        costThb: toCost(block.commute.cost) || undefined,
        mapsMinutes: block.commute.mapsMinutes,
        mapsDistanceM: block.commute.mapsDistanceM,
        minutesSource: block.commute.minutesSource,
      }
    : undefined;
  return {
    kind: "spot" as const,
    spotId: block.spotId,
    body: title,
    commute: commute?.mode ? commute : undefined,
  };
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

export function deskStoryAsPublic(
  story: CreatorStory,
  creator: { username: string; displayName: string },
): Story {
  return {
    slug: story.id,
    title: story.title,
    summary: story.about,
    coverUrl: story.coverUrl,
    destination: {
      name: story.title,
      country: story.country,
      lat: story.spots.find((spot) => spot.lat != null)?.lat ?? 0,
      lng: story.spots.find((spot) => spot.lng != null)?.lng ?? 0,
    },
    creator: {
      username: creator.username,
      displayName: creator.displayName,
      bio: "",
      avatarUrl: "",
    },
    spots: story.spots.map(deskSpotAsPublic),
    itineraries: story.plans.map(deskPlanAsPublic),
  };
}

export function deskPlanAsPublic(plan: StoryPlan): Itinerary {
  return {
    slug: plan.id,
    title: plan.title,
    summary: plan.summary,
    coverUrl: plan.images[0] ?? "",
    days: plan.days.map((day) => ({
      title: day.title,
      brief: day.brief.trim() || undefined,
      blocks: day.blocks.map((block) => toBlock(block, [])),
    })),
    reservations: plan.reservations.map(toPublicReservation),
    archived: plan.archived ?? false,
  };
}

function deskSpotAsPublic(spot: StorySpot): Spot {
  const type = spotTypes.includes(spot.category as Spot["type"]) ? (spot.category as Spot["type"]) : "sightseeing";
  return {
    id: spot.id,
    type,
    title: spot.title,
    description: spot.summary,
    images: spot.images,
    lat: spot.lat ?? 0,
    lng: spot.lng ?? 0,
    address: spot.placeName,
    avgMinutes: toMinutes(spot.duration),
    avgCostThb: toCost(spot.cost),
    tags: [spot.subcategory, spot.difficulty, spot.season, spot.ageGroup].filter(Boolean),
    archived: spot.archived ?? false,
  };
}
