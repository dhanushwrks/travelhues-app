import type { CommuteMode } from "@/lib/types";

export const commuteModeLabel: Record<CommuteMode, string> = {
  walk: "Walk",
  cycle: "Cycle",
  cab: "Cab",
  public: "Public transport",
  self_drive: "Self drive",
  flight: "Flight",
};

export function formatCommuteDistance(meters?: number) {
  if (!meters || meters <= 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

export function formatCommuteMinutes(minutes?: number) {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
