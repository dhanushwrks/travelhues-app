import type { Day, Spot, Story } from "@/lib/types";

export function spotById(story: Story, id: string) {
  return story.spots.find((spot) => spot.id === id);
}

export function spotsInOrder(story: Story, days: Day[]): Spot[] {
  const seen = new Set<string>();
  const spots: Spot[] = [];

  for (const day of days) {
    for (const block of day.blocks) {
      if (block.kind !== "spot" || seen.has(block.spotId)) continue;
      const spot = spotById(story, block.spotId);
      if (!spot) continue;
      seen.add(block.spotId);
      spots.push(spot);
    }
  }

  return spots;
}
