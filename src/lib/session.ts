import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Session = {
  token: string;
  role: "tcc" | "traveler";
  username: string;
  displayName: string;
};

export async function requireSession(): Promise<Session> {
  const jar = await cookies();
  const token = jar.get("th_access")?.value;
  if (!token) redirect("/login");
  return {
    token,
    role: jar.get("th_role")?.value === "tcc" ? "tcc" : "traveler",
    username: jar.get("th_username")?.value ?? "",
    displayName: decodeURIComponent(jar.get("th_name")?.value ?? ""),
  };
}
