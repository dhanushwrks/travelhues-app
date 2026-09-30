import { redirect } from "next/navigation";

import { StoryForm } from "@/components/story-form";
import { loadEnabledCountries } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { DeskScope } from "@/lib/studio-desk";

export default async function NewTripPage() {
  const session = await requireSession();
  if (session.role !== "traveler") redirect("/");
  const countries = await loadEnabledCountries();
  return (
    <DeskScope home="/trips">
      <StoryForm countries={countries} />
    </DeskScope>
  );
}
