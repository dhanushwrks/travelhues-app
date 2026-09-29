import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto md:justify-center">
      <AuthForm mode="signup" intent="traveler" />
    </div>
  );
}
