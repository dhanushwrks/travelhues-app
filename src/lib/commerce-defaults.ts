import { loadAdminStore } from "@/lib/admin-mock";

/** Default purchase-only price (INR) from admin commerce settings. */
export function defaultPurchasePriceInr() {
  try {
    return loadAdminStore().settings.defaults.priceInr || 99;
  } catch {
    return 99;
  }
}
