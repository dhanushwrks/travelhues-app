import { AuthForm } from "@/components/auth-form";

export default function CreatorLoginPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto md:justify-center">
      <AuthForm mode="login" intent="tcc" />
    </div>
  );
}
