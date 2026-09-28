import { AuthForm } from "@/components/auth-form";

export default function UserLoginPage() {
  return (
    <div className="h-full overflow-y-auto">
      <AuthForm mode="login" intent="traveler" />
    </div>
  );
}
