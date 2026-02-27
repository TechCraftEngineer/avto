import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" && "h-px w-full",
        orientation === "vertical" && "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
