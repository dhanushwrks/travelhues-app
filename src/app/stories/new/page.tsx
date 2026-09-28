import { redirect } from "next/navigation";

import { NewStoryForm } from "@/components/new-story-form";
import { requireSession } from "@/lib/session";

export default async function NewStoryPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  return <NewStoryForm />;
}
