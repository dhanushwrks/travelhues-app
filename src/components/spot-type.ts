import {
  Bed,
  Landmark,
  Sailboat,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { SpotType } from "@/lib/types";

export const spotTypeMeta: Record<
  SpotType,
  { label: string; icon: LucideIcon; chip: string; ink: string }
> = {
  stay: {
    label: "Stay",
    icon: Bed,
    chip: "bg-[#1d4e89] text-white",
    ink: "text-[#1d4e89]",
  },
  food: {
    label: "Food",
    icon: UtensilsCrossed,
    chip: "bg-[#c45c26] text-white",
    ink: "text-[#c45c26]",
  },
  activity: {
    label: "Activity",
    icon: Sailboat,
    chip: "bg-[#0c6e6a] text-white",
    ink: "text-[#0c6e6a]",
  },
  sightseeing: {
    label: "Sightseeing",
    icon: Landmark,
    chip: "bg-[#5c4d8a] text-white",
    ink: "text-[#5c4d8a]",
  },
  shop: {
    label: "Shop",
    icon: ShoppingBag,
    chip: "bg-[#9a3d55] text-white",
    ink: "text-[#9a3d55]",
  },
};
