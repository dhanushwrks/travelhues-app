"use client";

import Image from "next/image";
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

export function AppNav({
  role,
  placement,
}: {
  role: "tcc" | "traveler";
  placement: "rail" | "bar";
}) {
  const pathname = usePathname();
  if (/^\/(login|signup|join|auth)(\/|$)/.test(pathname) || pathname === "/glimpse") return null;

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

  return (
    <nav className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
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
