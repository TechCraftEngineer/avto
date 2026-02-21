import { cn } from "@qbs-autonaim/ui/utils";
import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({
  children,
  href,
  variant = "default",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        variant === "outline" &&
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
