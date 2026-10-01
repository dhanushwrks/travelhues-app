"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Copyright,
  Flag,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShoppingBag,
  Users,
  ClipboardList,
  FileStack,
  UserRoundSearch,
} from "lucide-react";

import { clearSession } from "@/lib/browser-session";

const pillars = [
  {
    label: "Analytics",
    href: "/admin",
    icon: BarChart3,
    active: (path: string) => path === "/admin" || path.startsWith("/admin/analytics"),
  },
  {
    label: "Manage",
    href: "/admin/manage/waitlist",
    icon: LayoutDashboard,
    active: (path: string) => path.startsWith("/admin/manage"),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings2,
    active: (path: string) => path.startsWith("/admin/settings"),
  },
];

const manageLinks = [
  { href: "/admin/manage/waitlist", label: "Waitlist", icon: ClipboardList },
  { href: "/admin/manage/reports", label: "Reports", icon: Flag },
  { href: "/admin/manage/copyright", label: "Copyright", icon: Copyright },
  { href: "/admin/manage/users", label: "Users", icon: UserRoundSearch },
  { href: "/admin/manage/content", label: "Content", icon: FileStack },
  { href: "/admin/manage/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/admin/manage/audit", label: "Audit log", icon: Users },
];

export function AdminShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearSession();
    router.push("/login/admin");
    router.refresh();
  }

  return (
    <div className="flex h-dvh w-full overflow-clip bg-background text-foreground">
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <Link href="/admin" className="px-2">
          <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-8 w-auto" />
          <span className="mt-1 block px-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Platform admin
          </span>
        </Link>
        <nav className="mt-8 grid gap-1">
          {pillars.map((item) => {
            const Icon = item.icon;
            const selected = item.active(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                  selected ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {pathname.startsWith("/admin/manage") ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Queues
            </p>
            <ul className="mt-2 grid gap-0.5">
              {manageLinks.map((item) => {
                const Icon = item.icon;
                const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm ${
                        selected ? "bg-secondary text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="mt-auto border-t border-border px-2 pt-4">
          <p className="truncate text-sm font-medium">@{username || "admin"}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 md:hidden">
          <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-7 w-auto" />
          <span className="text-xs font-medium text-muted-foreground">Admin</span>
          <button type="button" onClick={signOut} className="ml-auto text-sm text-primary">
            Sign out
          </button>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {[...pillars, ...manageLinks.slice(0, 4)].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
