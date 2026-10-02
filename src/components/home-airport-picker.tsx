"use client";

import { flightDealOrigins } from "@/lib/types";

const labels: Record<string, string> = {
  BLR: "Bengaluru",
  BOM: "Mumbai",
  HYD: "Hyderabad",
  DEL: "Delhi",
  MAA: "Chennai",
};

export function HomeAirportPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  return (
    <select
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Choose home airport</option>
      {flightDealOrigins.map((code) => (
        <option key={code} value={code}>
          {labels[code] ?? code} ({code})
        </option>
      ))}
    </select>
  );
}
