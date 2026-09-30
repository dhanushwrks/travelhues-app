import { redirect } from "next/navigation";

import { GlimpseForm } from "@/components/glimpse-form";
import { loadEnabledCountries, loadStories } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function NewShortPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const [stories, countries] = await Promise.all([
    loadStories(session.token),
    loadEnabledCountries(),
  ]);
  const mine = (stories ?? []).filter((story) => story.creator.username === session.username);
  return (
    <div className="h-full overflow-y-auto">
      <GlimpseForm stories={mine} countries={countries} />
    </div>
  );
}
