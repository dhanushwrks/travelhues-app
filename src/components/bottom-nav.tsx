"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, Luggage, PenLine, Play, Search, UserRound } from "lucide-react";

const travelerItems = [
  {
    href: "/",
    label: "Explore",
    icon: Compass,
    featured: false,
    active: (path: string) =>
      path === "/" ||
      path.startsWith("/stories") ||
      path.startsWith("/u/") ||
      path.startsWith("/destinations"),
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    featured: false,
    active: (path: string) => path === "/search" || path.startsWith("/search/"),
  },
  {
    href: "/shorts",
    label: "Shorts",
    icon: Play,
    featured: true,
    active: (path: string) => path === "/shorts" || path.startsWith("/shorts/") || path === "/glimpse" || path.startsWith("/glimpse/"),
  },
  {
    href: "/trips",
    label: "My trips",
    icon: Luggage,
    featured: false,
    active: (path: string) => path === "/trips" || path.startsWith("/trips/"),
  },
  {
    href: "/account",
    label: "Profile",
    icon: UserRound,
    featured: false,
    active: (path: string) => path === "/account" || path.startsWith("/account/"),
  },
];

const creatorItems = [
  {
    href: "/storefront",
    label: "Storefront",
    icon: LayoutGrid,
    featured: false,
    active: (path: string) => path === "/storefront" || path.startsWith("/storefront/"),
  },
  {
    href: "/studio",
    label: "Studio",
    icon: PenLine,
    featured: false,
    active: (path: string) => path === "/studio" || path.startsWith("/studio/"),
  },
];

export function AppNav({
  role,
  placement,
}: {
  role: "tcc" | "traveler";
  placement: "rail" | "bar";
}) {
  const pathname = usePathname();
  if (/^\/(login|signup|join|auth)(\/|$)/.test(pathname)) return null;

  const items = role === "tcc" ? creatorItems : travelerItems;

  if (placement === "rail") {
    return (
      <nav className="hidden h-full w-56 shrink-0 flex-col bg-card px-3 py-6 md:flex">
        <Link href={role === "tcc" ? "/storefront" : "/"} className="px-3">
          <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-8 w-auto" />
        </Link>
        <ul className="mt-8 grid gap-1">
          {items.map((item) => {
            const selected = item.active(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                    selected ? "bg-primary/10 text-primary" : "text-muted-foreground"
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

  const featured = items.some((item) => item.featured);

  return (
    <nav
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-transparent md:hidden ${
        featured
          ? "px-3 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          : "pb-[env(safe-area-inset-bottom)]"
      }`}
    >
      <ul
        className={`pointer-events-auto grid ${
          featured
            ? "relative items-end rounded-[1.75rem] bg-card px-1 pt-2 pb-1.5 shadow-[0_8px_30px_rgba(18,35,42,0.08)] ring-1 ring-border"
            : ""
        } ${
          items.length >= 5 ? "grid-cols-5" : items.length >= 4 ? "grid-cols-4" : items.length > 2 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {items.map((item) => {
          const selected = item.active(pathname);
          const Icon = item.icon;
          if (item.featured) {
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={selected ? "page" : undefined}
                  className="absolute top-0 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(225,46,47,0.35)] ring-4 ring-background"
                >
                  <Icon className="size-6 fill-current" />
                </Link>
                <span className="block h-12" aria-hidden />
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
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
