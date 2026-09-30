import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "cn";

const backClass = "grid size-10 shrink-0 place-items-center rounded-full";

type BackLinkProps = {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
};

/** Icon-only back control — matches studio/search/onboarding chevron pattern. */
export function BackLink({ href, onClick, label = "Back", className }: BackLinkProps) {
  const icon = <ChevronLeft className="size-5" />;
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cn(backClass, className)}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn(backClass, className)}>
      {icon}
    </button>
  );
}
