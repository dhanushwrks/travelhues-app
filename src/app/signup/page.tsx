import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="h-full overflow-y-auto">
      <AuthForm mode="signup" intent="traveler" />
    </div>
  );
}
