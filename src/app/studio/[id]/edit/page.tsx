import { redirect } from "next/navigation";

import { StoryForm } from "@/components/story-form";
import { loadEnabledCountries } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id } = await params;
  const countries = await loadEnabledCountries();
  return <StoryForm countries={countries} storyId={id} />;
}
