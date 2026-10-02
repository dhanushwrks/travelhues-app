import { notFound, redirect } from "next/navigation";

import { PlanForm } from "@/components/plan-form";
import { SpotForm } from "@/components/spot-form";
import { requireSession } from "@/lib/session";
import { DeskScope } from "@/lib/studio-desk";

export default async function EditTripItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tab: string; itemId: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "traveler") redirect("/");
  const { id, tab, itemId } = await params;
  const { resume } = await searchParams;
  if (tab === "spots") {
    return (
      <DeskScope home="/plans">
        <SpotForm storyId={id} spotId={itemId} />
      </DeskScope>
    );
  }
  if (tab !== "plans") notFound();
  return (
    <DeskScope home="/plans">
      <PlanForm storyId={id} planId={itemId} resume={resume === "1"} />
    </DeskScope>
  );
}
