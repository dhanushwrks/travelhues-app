import { AuthForm } from "@/components/auth-form";

export default async function UserLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error = "", next = "" } = await searchParams;
  return (
    <div className="flex h-full flex-col overflow-y-auto md:justify-center">
      <AuthForm mode="login" intent="traveler" notice={error} nextPath={next} />
    </div>
  );
}
