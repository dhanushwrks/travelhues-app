import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionRole = "tcc" | "traveler" | "admin";

export type Session = {
  token: string;
  role: SessionRole;
  username: string;
  displayName: string;
};

function readRole(value: string | undefined): SessionRole {
  if (value === "admin") return "admin";
  if (value === "tcc") return "tcc";
  return "traveler";
}

export function homeForRole(role: SessionRole) {
  if (role === "admin") return "/admin";
  if (role === "tcc") return "/storefront";
  return "/";
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("th_access")?.value;
  if (!token) return null;
  return {
    token,
    role: readRole(jar.get("th_role")?.value),
    username: jar.get("th_username")?.value ?? "",
    displayName: decodeURIComponent(jar.get("th_name")?.value ?? ""),
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login/admin");
  if (session.role !== "admin") redirect(homeForRole(session.role));
  return session;
}

export { GUEST_SHORTS_COOKIE, GUEST_SHORTS_LIMIT } from "@/lib/guest";
