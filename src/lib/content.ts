import { thailand } from "@/lib/mock/thailand";
import type { Story } from "@/lib/types";

const stories: Story[] = [thailand];

export function getStories() {
  return stories;
}

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export function getItinerary(storySlug: string, itinerarySlug: string) {
  const story = getStory(storySlug);
  const itinerary = story?.itineraries.find(
    (item) => item.slug === itinerarySlug,
  );
  if (!story || !itinerary) return undefined;
  return { story, itinerary };
}

export function getCreator(username: string) {
  const story = stories.find((item) => item.creator.username === username);
  if (!story) return undefined;
  return {
    creator: story.creator,
    stories: stories.filter((item) => item.creator.username === username),
  };
}
