import { AuthForm } from "@/components/auth-form";

export default function CreatorLoginPage() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto">
      <AuthForm mode="login" intent="tcc" />
    </div>
  );
}
