import { notFound, redirect } from "next/navigation";

import { PlanForm } from "@/components/plan-form";
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
  if (tab !== "plans") notFound();
  const { resume } = await searchParams;
  return (
    <DeskScope home="/trips">
      <PlanForm storyId={id} planId={itemId} resume={resume === "1"} />
    </DeskScope>
  );
}
