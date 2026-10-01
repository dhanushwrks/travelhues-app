import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getSession, homeForRole } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  const query = await searchParams;
  return <AdminLoginForm notice={query.error ?? ""} />;
}
