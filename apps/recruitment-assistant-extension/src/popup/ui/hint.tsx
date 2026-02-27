import { cn } from "./cn";

interface HintProps {
  children: React.ReactNode;
  className?: string;
  icon?: "info" | "steps";
}

/** Компактная подсказка для пользователя */
export function Hint({ children, className, icon = "info" }: HintProps) {
  return (
    <output
      className={cn(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] leading-normal",
        "border-blue-200/80 bg-blue-50/70 text-blue-900",
        className,
      )}
    >
      <span className="shrink-0 pt-0.5" aria-hidden>
        {icon === "steps" ? "1️⃣" : "💡"}
      </span>
      <span className="min-w-0 flex-1 [text-wrap:balance]">{children}</span>
    </output>
  );
}
