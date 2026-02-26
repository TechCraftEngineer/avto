import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Alert({
  className,
  variant = "destructive",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-3 text-sm",
        variant === "destructive" &&
          "border-destructive/50 bg-destructive/10 text-destructive",
        variant === "default" && "bg-muted text-muted-foreground",
        variant === "success" &&
          "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
        className,
      )}
      {...props}
    />
  );
}
