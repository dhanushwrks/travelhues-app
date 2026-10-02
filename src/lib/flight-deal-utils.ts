export function dealDaysLeft(validUntil: string) {
  const end = Date.parse(validUntil);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function formatDealDateRange(departure: string, returnDate: string) {
  const fmt = (iso: string) => {
    const date = new Date(`${iso}T00:00:00Z`);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  };
  if (!returnDate) return fmt(departure);
  return `${fmt(departure)} – ${fmt(returnDate)}`;
}
