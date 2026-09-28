import { redirect } from "next/navigation";

import { StudioHome } from "@/components/studio-home";
import { requireSession } from "@/lib/session";

export default async function StudioPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  return <StudioHome />;
}
