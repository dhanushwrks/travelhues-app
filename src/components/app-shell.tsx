import { BottomNav } from "@/components/bottom-nav";

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "tcc" | "traveler";
}) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-card text-foreground shadow-[0_0_0_1px_rgba(18,35,42,0.06)]">
      <div className="min-h-0 flex-1">{children}</div>
      <BottomNav role={role} />
    </div>
  );
}
