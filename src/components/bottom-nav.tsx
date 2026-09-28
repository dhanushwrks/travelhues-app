"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, PenLine, UserRound } from "lucide-react";

const travelerItems = [
  {
    href: "/",
    label: "Explore",
    icon: Compass,
    active: (path: string) =>
      path === "/" ||
      path.startsWith("/stories") ||
      path.startsWith("/glimpse") ||
      path.startsWith("/u/"),
  },
  {
    href: "/account",
    label: "Profile",
    icon: UserRound,
    active: (path: string) => path === "/account" || path.startsWith("/account/"),
  },
];

const creatorItems = [
  {
    href: "/storefront",
    label: "Storefront",
    icon: LayoutGrid,
    active: (path: string) => path === "/storefront" || path.startsWith("/storefront/"),
  },
  {
    href: "/studio",
    label: "Studio",
    icon: PenLine,
    active: (path: string) => path === "/studio" || path.startsWith("/studio/"),
  },
];

export function BottomNav({ role }: { role: "tcc" | "traveler" }) {
  const pathname = usePathname();
  if (/^\/(login|signup|join|auth)(\/|$)/.test(pathname) || pathname === "/glimpse") return null;

  const items = role === "tcc" ? creatorItems : travelerItems;

  return (
    <nav className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-2">
        {items.map((item) => {
          const selected = item.active(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  selected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
