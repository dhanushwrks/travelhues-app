/** Cross-request cache TTL for public API reads (seconds). */
export const PUBLIC_CACHE_SECONDS = 600;

export const CACHE_TAGS = {
  settings: "travelhues-settings",
  countries: "travelhues-countries",
  spotCatalog: "travelhues-spot-catalog",
  shortAds: "travelhues-short-ads",
} as const;

/**
 * After admin PATCH /admin/settings, call revalidatePublicSettingsCache() so
 * loadEnabledCountries and loadBrandLinks pick up new values within one revalidate cycle.
 */
