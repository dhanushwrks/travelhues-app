import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { GUEST_SHORTS_COOKIE } from "@/lib/guest";

const openExact = new Set([
  "/",
  "/search",
  "/shorts",
  "/trips",
  "/login",
  "/login/user",
  "/login/tcc",
  "/signup",
  "/join",
  "/privacy",
  "/terms",
]);

function isPublicPath(pathname: string) {
  if (openExact.has(pathname)) return true;
  if (pathname.startsWith("/join/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/search/")) return true;
  if (/^\/stories\/[^/]+\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/media") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("th_access")?.value;
  if (token) return NextResponse.next();

  if (!isPublicPath(pathname)) {
    const login = new URL("/login/user", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  if (pathname === "/shorts") {
    response.cookies.set(GUEST_SHORTS_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
