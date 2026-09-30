"use client";

import { BlogForm } from "@/components/blog-form";
import { PlanForm } from "@/components/plan-form";
import { SpotForm } from "@/components/spot-form";
import type { StoryTab } from "@/lib/mock/studio";
import { useDesk, useDeskHome } from "@/lib/studio-desk";

export function StoryPieceForm({
  storyId,
  tab,
  fromPlan = false,
  planId = "",
}: {
  storyId: string;
  tab: StoryTab;
  fromPlan?: boolean;
  planId?: string;
}) {
  const home = useDeskHome();
  useDesk();

  if (tab === "spots") {
    return (
      <SpotForm
        storyId={storyId}
        returnTo={
          fromPlan
            ? planId
              ? `${home}/${storyId}/plans/${planId}/edit?resume=1`
              : `${home}/${storyId}/plans/new`
            : undefined
        }
      />
    );
  }
  if (tab === "plans") return <PlanForm storyId={storyId} />;
  return <BlogForm storyId={storyId} />;
}
