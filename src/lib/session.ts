import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Session = {
  token: string;
  role: "tcc" | "traveler";
  username: string;
  displayName: string;
};

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("th_access")?.value;
  if (!token) return null;
  return {
    token,
    role: jar.get("th_role")?.value === "tcc" ? "tcc" : "traveler",
    username: jar.get("th_username")?.value ?? "",
    displayName: decodeURIComponent(jar.get("th_name")?.value ?? ""),
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export { GUEST_SHORTS_COOKIE, GUEST_SHORTS_LIMIT } from "@/lib/guest";
