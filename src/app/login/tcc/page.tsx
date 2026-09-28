import { AuthForm } from "@/components/auth-form";

export default function CreatorLoginPage() {
  return (
    <div className="h-full overflow-y-auto">
      <AuthForm mode="login" intent="tcc" />
    </div>
  );
}
