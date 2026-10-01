"use client";

export function PurchaseAccessFields({
  purchaseOnly,
  priceInr,
  onPurchaseOnlyChange,
  onPriceChange,
}: {
  purchaseOnly: boolean;
  priceInr: number;
  onPurchaseOnlyChange: (value: boolean) => void;
  onPriceChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-secondary/70 p-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={purchaseOnly}
          onChange={(event) => onPurchaseOnlyChange(event.target.checked)}
          className="mt-1 size-4 accent-foreground"
        />
        <span>
          <span className="font-medium">Purchase only</span>
          <span className="mt-0.5 block text-muted-foreground">
            Travelers see a lock and must buy before opening the full content.
          </span>
        </span>
      </label>
      {purchaseOnly ? (
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Price (INR)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={priceInr}
            onChange={(event) => onPriceChange(Math.max(1, Number(event.target.value) || 99))}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3"
          />
        </label>
      ) : null}
    </div>
  );
}
