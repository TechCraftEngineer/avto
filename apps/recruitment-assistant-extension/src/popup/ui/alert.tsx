import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Alert({
  className,
  variant = "destructive",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-3 text-sm",
        variant === "destructive" &&
          "border-destructive/50 bg-destructive/10 text-destructive",
        variant === "default" && "bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
