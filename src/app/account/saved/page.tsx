import { redirect } from "next/navigation";

import { SavedLibrary } from "@/components/saved-library";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function SavedPage() {
  const session = await requireSession();
  if (session.role !== "traveler") redirect("/account");
  const library = (await loadLibrary(session.token)) ?? emptyLibrary;
  const marks = library.marks.filter((mark) => mark.action === "save");
  return <SavedLibrary marks={marks} />;
}
