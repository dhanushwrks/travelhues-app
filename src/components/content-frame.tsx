"use client";

import { usePathname } from "next/navigation";

export function ContentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const narrow = pathname === "/shorts" || pathname === "/glimpse";

  return (
    <div className="flex min-h-0 flex-1 flex-col md:px-4 md:py-4">
      <div
        className={`mx-auto min-h-0 w-full flex-1 overflow-hidden bg-card md:rounded-3xl ${
          narrow ? "max-w-[430px]" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
