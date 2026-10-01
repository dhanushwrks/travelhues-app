import { redirect } from "next/navigation";

export default async function GlimpseRedirect({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; start?: string }>;
}) {
  const { country = "", start = "" } = await searchParams;
  const query = new URLSearchParams();
  if (country) query.set("country", country);
  if (start) query.set("start", start);
  const suffix = query.toString();
  redirect(suffix ? `/hues?${suffix}` : "/hues");
}
