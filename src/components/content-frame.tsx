"use client";

import { usePathname } from "next/navigation";

export function ContentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname === "/shorts" || pathname === "/glimpse";

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${immersive ? "" : "md:px-4 md:py-4"}`}>
      <div
        className={`min-h-0 w-full flex-1 overflow-hidden bg-card ${
          immersive
            ? "h-full"
            : "mx-auto max-w-6xl md:rounded-3xl max-md:[&>*]:!pb-28"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
