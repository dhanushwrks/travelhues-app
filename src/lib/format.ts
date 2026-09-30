import type { Spot, SpotType } from "@/lib/types";

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatDuration(minutes: number, type: SpotType) {
  if (type === "stay") return "Overnight";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function formatInr(amount: number) {
  return rupee.format(Math.round(amount));
}

export function formatCost(amount: number, type: SpotType) {
  if (amount <= 0) return "Free";
  const priced = `about ${formatInr(amount)}`;
  if (type === "stay") return `${priced} a night`;
  return priced;
}

export function formatSpotMeta(spot: Spot) {
  return `${formatDuration(spot.avgMinutes, spot.type)}, ${formatCost(spot.avgCostThb, spot.type)}`;
}
