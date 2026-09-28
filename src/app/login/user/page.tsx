import { AuthForm } from "@/components/auth-form";

export default async function UserLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error = "" } = await searchParams;
  return (
    <div className="h-full overflow-y-auto">
      <AuthForm mode="login" intent="traveler" notice={error} />
    </div>
  );
}
