import type { LabelHTMLAttributes } from "react";
import { cn } from "./cn";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // htmlFor передаётся через props при использовании
    // biome-ignore lint/a11y/noLabelWithoutControl: Label — обёртка, htmlFor задаётся родителем
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
