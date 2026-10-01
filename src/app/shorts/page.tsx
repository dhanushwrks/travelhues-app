import { redirect } from "next/navigation";

export default async function ShortsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; start?: string }>;
}) {
  const { country = "", start = "" } = await searchParams;
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (start) params.set("start", start);
  const query = params.toString();
  redirect(query ? `/hues?${query}` : "/hues");
}
