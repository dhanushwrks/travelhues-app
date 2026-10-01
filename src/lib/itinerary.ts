import type { Day, Itinerary, Reservation, Spot, Story } from "@/lib/types";

export function itineraryBudget(story: Story, days: Day[], reservations: Reservation[] = []) {
  let total = 0;
  for (const day of days) {
    for (const block of day.blocks) {
      if (block.kind !== "spot") continue;
      const spot = spotById(story, block.spotId);
      if (spot) total += spot.avgCostThb;
      if (block.commute?.costThb) total += block.commute.costThb;
    }
  }
  for (const item of reservations) {
    if (item.estCostThb) {
      total += item.estCostThb;
      continue;
    }
    if (item.spotId) {
      const spot = spotById(story, item.spotId);
      if (spot) total += spot.avgCostThb;
    }
  }
  const perDay = days.length > 0 ? Math.round(total / days.length) : 0;
  return { total, perDay };
}

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

export function itineraryReservations(itinerary: Itinerary) {
  return itinerary.reservations ?? [];
}
