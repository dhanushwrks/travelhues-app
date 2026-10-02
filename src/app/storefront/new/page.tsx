import { redirect } from "next/navigation";

import { NewPostScreen } from "@/components/new-post-screen";
import { requireSession } from "@/lib/session";

export default async function NewPostPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  return <NewPostScreen />;
}
