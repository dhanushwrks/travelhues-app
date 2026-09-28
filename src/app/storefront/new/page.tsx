import { redirect } from "next/navigation";

import { PostComposer } from "@/components/post-composer";
import { requireSession } from "@/lib/session";

export default async function NewPostPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  return <PostComposer />;
}
