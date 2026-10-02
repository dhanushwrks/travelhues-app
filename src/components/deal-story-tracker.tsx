"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { saveDealAttribution } from "@/lib/deal-attribution";
import { readCookie } from "@/lib/browser-session";
import { trackFlightDealEvent } from "@/lib/remote";

export function DealStoryTracker({ dealId }: { dealId: string }) {
  const params = useSearchParams();
  const id = dealId || params.get("deal") || "";

  useEffect(() => {
    if (!id) return;
    saveDealAttribution(id);
    const token = readCookie("th_access");
    const key = `th_deal_story_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void trackFlightDealEvent(id, "story_open", token || undefined);
  }, [id]);

  return null;
}
