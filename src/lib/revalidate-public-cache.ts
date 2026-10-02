"use server";

import { updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/server-cache";

export async function revalidatePublicSettingsCache() {
  updateTag(CACHE_TAGS.settings);
  updateTag(CACHE_TAGS.countries);
}
