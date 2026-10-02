const DEAL_COOKIE = "th_deal_ctx";

export function readDealAttribution(): string {
  if (typeof document === "undefined") return "";
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEAL_COOKIE}=`));
  if (!raw) return "";
  try {
    return decodeURIComponent(raw.slice(DEAL_COOKIE.length + 1));
  } catch {
    return "";
  }
}

export function saveDealAttribution(dealId: string) {
  if (typeof document === "undefined" || !dealId) return;
  const maxAge = 60 * 60 * 24;
  document.cookie = `${DEAL_COOKIE}=${encodeURIComponent(dealId)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearDealAttribution() {
  if (typeof document === "undefined") return;
  document.cookie = `${DEAL_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
