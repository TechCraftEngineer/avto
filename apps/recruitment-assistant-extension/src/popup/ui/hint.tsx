import { cn } from "./cn";

interface HintProps {
  children: React.ReactNode;
  className?: string;
  icon?: "info" | "steps";
}

/** Компактная подсказка для пользователя */
export function Hint({ children, className, icon = "info" }: HintProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-2 rounded-md border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-900",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon === "steps" ? "1️⃣" : "💡"}
      </span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
