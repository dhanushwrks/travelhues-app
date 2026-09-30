"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, LayoutGrid, Luggage, PenLine, Play, Plus, Search, Store, UserRound } from "lucide-react";
import { useState } from "react";

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

function creatorItems(username: string) {
  const storefrontHref = username ? `/u/${username}` : "/account";
  return [
    {
      href: "/storefront",
      label: "Home",
      icon: LayoutGrid,
      featured: false,
      active: (path: string) =>
        path === "/storefront" || (path.startsWith("/storefront/") && path !== "/storefront/new" && !path.startsWith("/storefront/new/")),
    },
    {
      href: "/studio",
      label: "Stories",
      icon: PenLine,
      featured: false,
      active: (path: string) => path === "/studio" || (path.startsWith("/studio/") && path !== "/studio/new" && !path.startsWith("/studio/new/")),
    },
    {
      href: "/storefront/new",
      label: "Create",
      icon: Plus,
      featured: true,
      active: (path: string) =>
        path === "/storefront/new" || path === "/shorts/new" || path === "/studio/new" || path.startsWith("/studio/new/"),
    },
    {
      href: storefrontHref,
      label: "Storefront",
      icon: Store,
      featured: false,
      active: (path: string) =>
        username ? path === `/u/${username}` || path.startsWith(`/u/${username}/`) : false,
    },
    {
      href: "/account",
      label: "Profile",
      icon: UserRound,
      featured: false,
      active: (path: string) => path === "/account" || path.startsWith("/account/"),
    },
  ];
}

export function AppNav({
  role,
  placement,
  username = "",
}: {
  role: "tcc" | "traveler";
  placement: "rail" | "bar";
  username?: string;
}) {
  const pathname = usePathname();
  if (/^\/(login|signup|join|auth)(\/|$)/.test(pathname)) return null;

  const items = role === "tcc" ? creatorItems(username) : travelerItems;

  if (placement === "rail") {
    return (
      <nav className="hidden h-full w-56 shrink-0 flex-col bg-card px-3 py-6 md:flex">
        <Link href={role === "tcc" ? "/storefront" : "/"} className="px-3">
          <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-8 w-auto" />
        </Link>
        <ul className="mt-8 grid gap-1">
          {items.map((item) => {
            if (item.featured && role === "tcc") {
              return (
                <li key={item.label}>
                  <RailCreate />
                </li>
              );
            }
            const selected = item.active(pathname);
            const Icon = item.icon;
            return (
              <li key={item.label}>
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
  const barItems = role === "tcc" ? items.filter((item) => !item.featured) : items;
  const columns = role === "tcc" ? barItems.length + 1 : items.length;

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
          columns >= 5 ? "grid-cols-5" : columns >= 4 ? "grid-cols-4" : columns > 2 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {role === "tcc"
          ? (() => {
              const split = Math.ceil(barItems.length / 2);
              const left = barItems.slice(0, split);
              const right = barItems.slice(split);
              const renderItem = (item: (typeof barItems)[number]) => {
                const selected = item.active(pathname);
                const Icon = item.icon;
                return (
                  <li key={item.label}>
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
              };
              return [
                ...left.map(renderItem),
                <li key="create" className="relative">
                  <BarCreate />
                  <span className="block h-12" aria-hidden />
                </li>,
                ...right.map(renderItem),
              ];
            })()
          : items.map((item) => {
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

function RailCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function choose(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close" : "Create"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground"
      >
        <Plus className={`size-5 ${open ? "rotate-45" : ""}`} />
        Create
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-30 mt-1 grid w-full gap-1 rounded-2xl bg-card p-1 shadow-[0_8px_30px_rgba(18,35,42,0.12)] ring-1 ring-border">
          <button
            type="button"
            onClick={() => choose("/storefront/new")}
            className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => choose("/shorts/new")}
            className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
          >
            Short
          </button>
          <button
            type="button"
            onClick={() => choose("/studio/new")}
            className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
          >
            Story
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BarCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function choose(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="absolute top-0 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      {open ? (
        <div className="absolute bottom-full left-1/2 mb-3 grid w-36 -translate-x-1/2 gap-2">
          <button
            type="button"
            onClick={() => choose("/storefront/new")}
            className="rounded-full bg-card px-4 py-2.5 text-sm font-medium shadow-[0_8px_20px_rgba(18,35,42,0.12)] ring-1 ring-border"
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => choose("/shorts/new")}
            className="rounded-full bg-card px-4 py-2.5 text-sm font-medium shadow-[0_8px_20px_rgba(18,35,42,0.12)] ring-1 ring-border"
          >
            Short
          </button>
          <button
            type="button"
            onClick={() => choose("/studio/new")}
            className="rounded-full bg-card px-4 py-2.5 text-sm font-medium shadow-[0_8px_20px_rgba(18,35,42,0.12)] ring-1 ring-border"
          >
            Story
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close" : "Create"}
        onClick={() => setOpen((value) => !value)}
        className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(225,46,47,0.35)] ring-4 ring-background"
      >
        <Plus className={`size-6 ${open ? "rotate-45" : ""}`} />
      </button>
    </div>
  );
}
