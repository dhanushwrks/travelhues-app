import { AppNav } from "@/components/bottom-nav";
import { ContentFrame } from "@/components/content-frame";

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "tcc" | "traveler";
}) {
  return (
    <div className="flex h-dvh w-full overflow-clip bg-background text-foreground md:flex-row">
      <AppNav role={role} placement="rail" />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <ContentFrame>{children}</ContentFrame>
        <AppNav role={role} placement="bar" />
      </div>
    </div>
  );
}
