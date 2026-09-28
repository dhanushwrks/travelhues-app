import { redirect } from "next/navigation";

import { StoryForm } from "@/components/story-form";
import { loadEnabledCountries } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function NewStoryPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const countries = await loadEnabledCountries();
  return <StoryForm countries={countries} />;
}
