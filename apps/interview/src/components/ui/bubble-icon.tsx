import { cn } from "@qbs-autonaim/ui/utils";
import type { ReactNode } from "react";

export function BubbleIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-16 items-center justify-center rounded-full bg-primary shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
